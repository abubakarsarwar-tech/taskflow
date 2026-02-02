import express from 'express';
import { Task, Board, Notification, Comment } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks for a board (with comment counts)
router.get('/board/:boardId', protect, async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const isMember = board.members && Array.isArray(board.members) ? board.members.some(m => m.id && m.id.toString() === req.user.id.toString()) : false;
    const isOwner = board.ownerId.toString() === req.user.id.toString();

    if (!board.isPublic && !isMember && !isOwner) {
      return res.status(403).json({ error: 'No permission' });
    }

    // Use sequelize to get tasks with comment counts
    const tasks = await Task.findAll({
      where: { boardId: board.id },
      include: [
        { model: Comment, as: 'comments', attributes: ['id'] }
      ],
      order: [['position', 'ASC'], ['createdAt', 'DESC']]
    });

    const tasksWithCount = tasks.map(task => {
      const taskData = task.get({ plain: true });
      return {
        ...taskData,
        commentsCount: taskData.comments ? taskData.comments.length : 0,
        comments: undefined // Remove the full comments array sent by include
      };
    });

    res.json(tasksWithCount);
  } catch (error) {
    console.error('❌ Fetch tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, labels, boardId } = req.body;
    console.log('📝 Attempting to create task:', { title, boardId, userId: req.user.id });

    if (!title || !boardId) {
      console.log('❌ Missing required fields:', { title, boardId });
      return res.status(400).json({ error: 'Title and boardId are required' });
    }

    const board = await Board.findByPk(boardId);
    if (!board) {
      console.log('❌ Board not found:', boardId);
      return res.status(404).json({ error: 'Board not found' });
    }

    console.log('📋 Found board:', board.name);

    const userMember = board.members && Array.isArray(board.members) ? board.members.find(m => m.id && m.id.toString() === req.user.id.toString()) : null;
    const isOwner = board.ownerId.toString() === req.user.id.toString();
    const isAdmin = isOwner || (userMember && userMember.role === 'admin');

    if (!isAdmin) {
      console.log('❌ Permission denied for user:', req.user.id);
      return res.status(403).json({ error: 'Only board admins or owners can create tasks' });
    }

    console.log('✅ Permissions verified. Creating task record...');

    const taskData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || [],
      boardId,
      userId: req.user.id,
      position: 0,
    };

    console.log('🚀 DB Insert data:', JSON.stringify(taskData, null, 2));

    const task = await Task.create(taskData);

    console.log('✨ Task created successfully in DB:', task.id);

    // Create notifications for all board members
    const notificationPromises = [];

    // Notify board owner
    notificationPromises.push(
      Notification.create({
        userId: board.ownerId,
        message: board.ownerId.toString() === req.user.id.toString()
          ? `You added a new task: "${task.title}" to board "${board.name}"`
          : `${req.user.name} added a new task: "${task.title}" to board "${board.name}"`,
        type: 'task_created',
        boardId: board.id,
        taskId: task.id
      })
    );

    // Notify all active members (only if members array exists and is valid)
    if (board.members && Array.isArray(board.members)) {
      board.members.forEach(member => {
        if (member.status === 'active' && member.id && member.id.toString() !== board.ownerId.toString()) {
          notificationPromises.push(
            Notification.create({
              userId: member.id,
              message: member.id.toString() === req.user.id.toString()
                ? `You added a new task: "${task.title}" to board "${board.name}"`
                : `${req.user.name} added a new task: "${task.title}" to board "${board.name}"`,
              type: 'task_created',
              boardId: board.id,
              taskId: task.id
            })
          );
        }
      });
    }

    const createdNotifications = await Promise.all(notificationPromises);
    console.log(`🔔 Created ${createdNotifications.length} notifications`);

    // Real-time synchronization
    const io = req.app.get('io');
    if (io) {
      // Notify everyone on the board about the new task
      io.to(`board:${board.id}`).emit('task_created', task.toJSON ? task.toJSON() : task);

      // Send notifications to individual users
      createdNotifications.forEach(notif => {
        if (notif) {
          io.to(`user:${notif.userId}`).emit('new_notification', notif.toJSON ? notif.toJSON() : notif);
        }
      });
    }

    res.status(201).json(task.toJSON ? task.toJSON() : task);
  } catch (error) {
    console.error('❌ Create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findByPk(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const userMember = board.members && Array.isArray(board.members) ? board.members.find(m => m.id && m.id.toString() === req.user.id.toString()) : null;
    const isOwner = board.ownerId.toString() === req.user.id.toString();
    const isAdmin = isOwner || (userMember && userMember.role === 'admin');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Only board admins or owners can edit tasks' });
    }

    if (req.body.title !== undefined) task.title = req.body.title.trim();
    if (req.body.description !== undefined) task.description = req.body.description.trim();
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.labels !== undefined) task.labels = req.body.labels;
    if (req.body.position !== undefined) task.position = req.body.position;

    await task.save();

    // Create notification for task move/update
    if (req.body.status !== undefined) {
      const dueDateInfo = task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : '';
      const notificationPromises = [];

      // Notify board owner
      notificationPromises.push(
        Notification.create({
          userId: board.ownerId,
          message: board.ownerId.toString() === req.user.id.toString()
            ? `Task "${task.title}" moved to ${req.body.status} in board "${board.name}"${dueDateInfo}`
            : `${req.user.name} moved task "${task.title}" to ${req.body.status} in board "${board.name}"${dueDateInfo}`,
          type: 'task_moved',
          boardId: board.id,
          taskId: task.id
        })
      );

      // Notify all active members (only if members array exists and is valid)
      if (board.members && Array.isArray(board.members)) {
        board.members.forEach(member => {
          if (member.status === 'active' && member.id) {
            notificationPromises.push(
              Notification.create({
                userId: member.id,
                message: member.id.toString() === req.user.id.toString()
                  ? `Task "${task.title}" moved to ${req.body.status} in board "${board.name}"${dueDateInfo}`
                  : `${req.user.name} moved task "${task.title}" to ${req.body.status} in board "${board.name}"${dueDateInfo}`,
                type: 'task_moved',
                boardId: board.id,
                taskId: task.id
              })
            );
          }
        });
      }

      const createdNotifications = await Promise.all(notificationPromises);

      // Real-time synchronization
      const io = req.app.get('io');
      if (io) {
        createdNotifications.forEach(notif => {
          if (notif) {
            io.to(`user:${notif.userId}`).emit('new_notification', notif.toJSON ? notif.toJSON() : notif);
          }
        });
      }
    }

    // Always emit task_updated for any changes
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board.id}`).emit('task_updated', task.toJSON ? task.toJSON() : task);
    }

    console.log('✅ Task updated:', task.id);
    res.json(task);
  } catch (error) {
    console.error('❌ Update task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findByPk(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const isOwner = board.ownerId.toString() === req.user.id.toString();
    const isAdmin = board.members && Array.isArray(board.members) ? board.members.some(m => m.id && m.id.toString() === req.user.id.toString() && m.role === 'admin') : false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only board admins can delete tasks' });
    }

    const taskTitle = task.title;
    await Task.destroy({ where: { id: req.params.id } });

    const notification = await Notification.create({
      userId: req.user.id,
      message: `Task "${taskTitle}" was deleted from board "${board.name}"`,
      type: 'task_deleted',
      boardId: board.id
    });

    // Real-time synchronization for delete
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board.id}`).emit('task_deleted', req.params.id);

      // Notify board owner/admins about deletion
      io.to(`user:${board.ownerId}`).emit('new_notification', notification.toJSON ? notification.toJSON() : notification);

      if (board.members && Array.isArray(board.members)) {
        board.members.forEach(m => {
          if (m.role === 'admin' && m.id) {
            io.to(`user:${m.id}`).emit('new_notification', notification.toJSON ? notification.toJSON() : notification);
          }
        });
      }
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Delete task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a task
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const { comment, screenshotUrl } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const board = await Board.findByPk(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const isMember = board.members && Array.isArray(board.members) ? board.members.some(m => m.id && m.id.toString() === req.user.id.toString()) : false;
    const isOwner = board.ownerId.toString() === req.user.id.toString();
    const isOwnerOrAdmin = isOwner || (board.members && Array.isArray(board.members) && board.members.some(m => m.id && m.id.toString() === req.user.id.toString() && m.role === 'admin'));

    if (!isMember && !isOwnerOrAdmin) {
      return res.status(403).json({ error: 'Only board members, admins, or owners can complete tasks' });
    }

    task.status = 'done';
    // task.completedAt = Date.now(); // Note: check if completedAt exists in model, I didn't add it but can use updated JSON field or just status
    await task.save();

    // Socket emission
    const io = req.app.get('io');
    if (io) {
      io.to(`board:${board.id}`).emit('task_updated', task.toJSON ? task.toJSON() : task);
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;