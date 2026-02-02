import express from 'express';
import { Comment, Task, Board, Notification } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/comments/:taskId - get all comments for a task
router.get('/:taskId', protect, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { taskId: req.params.taskId },
      order: [['createdAt', 'ASC']]
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/comments/:taskId - add a comment (with optional screenshot and parentId for replies)
router.post('/:taskId', protect, async (req, res) => {
  try {
    const { text, screenshotUrl, type, parentId, attachments } = req.body; // type can be 'comment' or 'completion'
    if (!text && !screenshotUrl) return res.status(400).json({ error: 'No comment or screenshot' });
    const task = await Task.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Must be board member or owner to comment
    const board = await Board.findByPk(task.boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    // Handle members JSON field which might be a string in some environments
    let members = board.members;
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch (e) {
        members = [];
      }
    }
    if (!Array.isArray(members)) members = [];

    const isMember = members.some(m => m.id && m.id.toString() === req.user.id.toString());
    const isOwner = board.ownerId && board.ownerId.toString() === req.user.id.toString();
    if (!isMember && !isOwner) return res.status(403).json({ error: 'Not a board member' });

    const comment = await Comment.create({
      taskId: req.params.taskId,
      userId: req.user.id,
      userName: req.user.name,
      text,
      screenshotUrl,
      attachments: attachments || [],
      type: type || 'comment',
      parentId: parentId || null
    });

    console.log('✅ Comment created:', comment.id, 'by user:', req.user.name);

    // Create notifications
    const notificationPromises = [];
    const mentionedUserIds = new Set();

    // Parse mentions
    if (text) {
      // Check members for mentions
      members.forEach(member => {
        if (member.id && text.includes(`@${member.name}`)) {
          mentionedUserIds.add(member.id.toString());
        }
      });
      // Check owner for mention (though they might be in members too)
      // Since we don't have owner name easily here without population, we rely on members list
      // which usually includes the owner if they were added as member, or we could populate owner
    }

    // Notify mentioned users first
    mentionedUserIds.forEach(userId => {
      if (userId !== req.user.id.toString()) {
        notificationPromises.push(
          Notification.create({
            userId,
            message: `${req.user.name} mentioned you in a comment on task "${task.title}"`,
            type: 'mention',
            boardId: board.id,
            taskId: task.id
          })
        );
      }
    });

    // Notify board owner if they're not the commenter and not already mentioned
    if (board.ownerId.toString() !== req.user.id.toString() && !mentionedUserIds.has(board.ownerId.toString())) {
      notificationPromises.push(
        Notification.create({
          userId: board.ownerId,
          message: `${req.user.name} commented on task "${task.title}" in board "${board.name}"`,
          type: 'comment_added',
          boardId: board.id,
          taskId: task.id
        })
      );
    }

    // Notify all active members (except the commenter and mentioned users)
    members.forEach(member => {
      if (member.status === 'active' && member.id &&
        member.id.toString() !== req.user.id.toString() &&
        !mentionedUserIds.has(member.id.toString())) {
        notificationPromises.push(
          Notification.create({
            userId: member.id,
            message: `${req.user.name} commented on task "${task.title}" in board "${board.name}"`,
            type: 'comment_added',
            boardId: board.id,
            taskId: task.id
          })
        );
      }
    });

    const createdNotifications = await Promise.all(notificationPromises);
    console.log(`📬 Created ${notificationPromises.length} notifications (${mentionedUserIds.size} mentions) for comment`);

    // Real-time synchronization via Socket.io
    const io = req.app.get('io');
    if (io) {
      // 1. Emit new comment to the board room (everyone looking at this board gets the update)
      io.to(`board:${board.id}`).emit('new_comment', comment.toJSON ? comment.toJSON() : comment);

      // 2. Emit each notification to the specific user's room
      createdNotifications.forEach(notif => {
        if (notif) {
          io.to(`user:${notif.userId}`).emit('new_notification', notif.toJSON ? notif.toJSON() : notif);
        }
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('❌ Create comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/comments/comment/:commentId - update a comment
router.patch('/comment/:commentId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = await Comment.findByPk(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get the task and board to check permissions
    const task = await Task.findByPk(comment.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const board = await Board.findByPk(task.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if user is the comment author, board owner, or admin
    const isAuthor = comment.userId.toString() === req.user.id.toString();
    const isOwner = board.ownerId && board.ownerId.toString() === req.user.id.toString();

    // Handle members JSON field
    let membersList = board.members;
    if (typeof membersList === 'string') {
      try {
        membersList = JSON.parse(membersList);
      } catch (e) {
        membersList = [];
      }
    }
    if (!Array.isArray(membersList)) membersList = [];

    const isMember = membersList.some(m => m.id && m.id.toString() === req.user.id.toString());
    const isAdmin = isOwner || membersList.some(m => m.id && m.id.toString() === req.user.id.toString() && m.role === 'admin');

    if (!isAuthor && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this comment' });
    }

    // Update the comment
    comment.text = text.trim();
    await comment.save();

    console.log('✅ Comment updated:', comment.id, 'by user:', req.user.name);
    res.json(comment);
  } catch (error) {
    console.error('❌ Update comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/comments/comment/:commentId - delete a comment
router.delete('/comment/:commentId', protect, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get the task and board to check permissions
    const task = await Task.findByPk(comment.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const board = await Board.findByPk(task.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if user is the comment author, board owner, or admin
    const isAuthor = comment.userId.toString() === req.user.id.toString();
    const isOwner = board.ownerId && board.ownerId.toString() === req.user.id.toString();

    // Handle members JSON field
    let membersList = board.members;
    if (typeof membersList === 'string') {
      try {
        membersList = JSON.parse(membersList);
      } catch (e) {
        membersList = [];
      }
    }
    if (!Array.isArray(membersList)) membersList = [];

    const isAdmin = isOwner || membersList.some(m => m.id && m.id.toString() === req.user.id.toString() && m.role === 'admin');

    if (!isAuthor && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Delete the comment
    await Comment.destroy({ where: { id: comment.id } });

    console.log('✅ Comment deleted:', comment.id, 'by user:', req.user.name);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
