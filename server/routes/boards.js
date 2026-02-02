import express from 'express';
import { Board, User, Task, Notification, sequelize } from '../models/index.js';
import { protect } from '../middleware/auth.js';
import { sendInviteEmail } from '../utils/email.js';
const { Op } = sequelize.Sequelize;

const router = express.Router();

/**
 * GET /api/boards
 * Fetch all boards visible to the logged-in user
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all boards where user is the owner
    const ownedBoards = await Board.findAll({
      where: { ownerId: userId },
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Fetch all boards and filter where user is an active member
    const allBoards = await Board.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filter boards where user is an active member
    const memberBoards = allBoards.filter(board => {
      if (!board.members || !Array.isArray(board.members)) return false;
      return board.members.some(m =>
        m.id && m.id.toString() === userId.toString() && m.status === 'active'
      );
    });

    // Combine owned and member boards, removing duplicates
    const boardIds = new Set();
    const combinedBoards = [];

    [...ownedBoards, ...memberBoards].forEach(board => {
      if (!boardIds.has(board.id)) {
        boardIds.add(board.id);
        combinedBoards.push(board);
      }
    });

    const boardsWithTaskCount = await Promise.all(combinedBoards.map(async (board) => {
      const taskCount = await Task.count({ where: { boardId: board.id } });
      const boardData = board.toJSON ? board.toJSON() : board;
      return {
        ...boardData,
        id: board.id,
        taskCount
      };
    }));

    res.json(boardsWithTaskCount);
  } catch (error) {
    console.error('❌ Fetch boards error:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

/**
 * GET /api/boards/community
 * Fetch all public boards
 */
router.get('/community', async (req, res) => {
  try {
    console.log('🔍 GET /api/boards/community');
    const boards = await Board.findAll({
      where: { isPublic: true },
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Add task count for each board
    const boardsWithTaskCount = await Promise.all(boards.map(async (board) => {
      const taskCount = await Task.count({ where: { boardId: board.id } });
      const boardData = board.toJSON ? board.toJSON() : board;
      return {
        ...boardData,
        id: board.id,
        taskCount
      };
    }));

    res.json(boardsWithTaskCount);
  } catch (error) {
    console.error('❌ Fetch community boards error:', error);
    res.status(500).json({ error: 'Failed to fetch community boards' });
  }
});

/**
 * GET /api/boards/:id
 * Get a single board by ID
 */
router.get('/:id', protect, async (req, res) => {
  try {
    console.log('🔍 GET /api/boards/:id - Board ID:', req.params.id);
    const board = await Board.findByPk(req.params.id);
    if (!board) {
      console.log('❌ Board not found');
      return res.status(404).json({ error: 'Board not found' });
    }

    const isMember = board.members && Array.isArray(board.members) ? board.members.some(m => m.id && m.id.toString() === req.user.id.toString()) : false;
    const isOwner = board.ownerId.toString() === req.user.id.toString();

    console.log('🔐 Permissions - isOwner:', isOwner, 'isMember:', isMember, 'isPublic:', board.isPublic);

    if (!board.isPublic && !isMember && !isOwner) {
      return res.status(403).json({ error: 'No permission to view this board' });
    }

    res.json(board.toJSON ? board.toJSON() : board);
  } catch (error) {
    console.error('❌ Fetch board error:', error);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

/**
 * GET /api/boards/:id/preview
 * Get public preview of a board (for invitations)
 */
router.get('/:id/preview', async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['name', 'avatar'] }],
      attributes: ['name', 'description', 'ownerId', 'isPublic']
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({
      id: board.id,
      name: board.name,
      description: board.description,
      owner: board.owner ? board.owner.name : 'Unknown',
      ownerAvatar: board.owner ? board.owner.avatar : ''
    });
  } catch (error) {
    console.error('❌ Board preview error:', error);
    res.status(500).json({ error: 'Failed to fetch board preview' });
  }
});

/**
 * POST /api/boards
 * Create a new board
 */
router.post('/', protect, async (req, res) => {
  try {
    console.log('📝 POST /api/boards - Request body:', req.body);
    console.log('👤 User:', req.user.id, req.user.name);

    const { name, description, isPublic, columns } = req.body;

    if (!name || name.trim() === '') {
      console.log('❌ Validation failed: Board name is required');
      return res.status(400).json({ error: 'Board name is required' });
    }

    console.log('✍️ Creating board with data:', {
      name: name.trim(),
      description: description ? description.trim() : '',
      isPublic: !!isPublic,
      ownerId: req.user.id,
    });

    const board = await Board.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      isPublic: !!isPublic,
      ownerId: req.user.id,
      members: [
        {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: 'admin',
          status: 'active',
          avatar: req.user.avatar || ''
        }
      ],
      columns: columns || [
        { id: 'todo', title: 'To Do', position: 0 },
        { id: 'in-progress', title: 'In Progress', position: 1 },
        { id: 'done', title: 'Done', position: 2 }
      ],
    });

    console.log('✅ Board created successfully!');
    console.log('📋 Board details:', {
      id: board.id,
      name: board.name,
      ownerId: board.ownerId,
      isPublic: board.isPublic
    });

    // Return updated board with populated owner
    const updatedBoard = await Board.findByPk(board.id, {
      include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] }]
    });

    res.status(201).json(updatedBoard.toJSON ? updatedBoard.toJSON() : updatedBoard);
  } catch (error) {
    console.error('❌ Create board error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create board', details: error.message });
  }
});

/**
 * PUT /api/boards/:id
 * Update a board
 */
router.put('/:id', protect, async (req, res) => {
  try {
    console.log('📝 PUT /api/boards/:id - Board ID:', req.params.id);
    console.log('📝 Update data:', req.body);

    const { id } = req.params;
    const { name, description, isPublic, columns } = req.body;

    const board = await Board.findByPk(id);
    if (!board) {
      console.log('❌ Board not found');
      return res.status(404).json({ error: 'Board not found' });
    }

    console.log('🔐 Checking permissions - Board ownerId:', board.ownerId, 'User ID:', req.user.id);

    // Check if requester is owner or admin
    const isOwner = board.ownerId.toString() === req.user.id.toString();
    const isAdmin = board.members && Array.isArray(board.members) ? board.members.some(m => m.id && m.id.toString() === req.user.id.toString() && m.role === 'admin') : false;

    if (!isOwner && !isAdmin) {
      console.log('❌ Not authorized');
      return res.status(403).json({ error: 'Not authorized to update this board' });
    }


    if (name !== undefined) board.name = name.trim();
    if (description !== undefined) board.description = description.trim();
    if (isPublic !== undefined) board.isPublic = !!isPublic;
    if (columns !== undefined) board.columns = columns;

    await board.save();
    console.log('✅ Board updated:', board.id);

    res.json(board);
  } catch (error) {
    console.error('❌ Update board error:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

/**
 * DELETE /api/boards/:id
 * Delete a board and associated tasks
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/boards/:id - Board ID:', req.params.id);

    const { id } = req.params;

    const board = await Board.findByPk(id);
    if (!board) {
      console.log('❌ Board not found');
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId.toString() !== req.user.id.toString()) {
      console.log('❌ Not authorized');
      return res.status(403).json({ error: 'Not authorized to delete this board' });
    }

    console.log('🗑️ Deleting tasks for board...');
    const deletedTasks = await Task.destroy({ where: { boardId: board.id } });
    console.log('✅ Deleted tasks:', deletedTasks);

    await Board.destroy({ where: { id: board.id } });
    console.log('✅ Board deleted:', id);

    res.json({ message: 'Board and associated tasks deleted successfully' });
  } catch (error) {
    console.error('❌ Delete board error:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

/**
 * POST /api/boards/:id/members
 * Add a member to a board by email
 */
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const { id } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const board = await Board.findByPk(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if requester is owner or admin
    const isOwner = board.ownerId.toString() === req.user.id.toString();
    const isAdmin = board.members && Array.isArray(board.members) ? board.members.some(m => m.id && m.id.toString() === req.user.id.toString() && m.role === 'admin') : false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only board owners and admins can add members' });
    }


    // Find user by email
    const userToAdd = await User.findOne({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found. Please invite them via email instead.' });
    }

    // Check if already a member
    const alreadyMember = board.members && Array.isArray(board.members) ? board.members.some(m => m.id && m.id.toString() === userToAdd.id.toString()) : false;
    if (alreadyMember || board.ownerId.toString() === userToAdd.id.toString()) {
      return res.status(400).json({ error: 'User is already a member or owner of this board' });
    }

    // Add member as pending
    const members = [...(board.members || [])];
    members.push({
      id: userToAdd.id,
      name: userToAdd.name,
      email: userToAdd.email,
      role: 'member',
      status: 'pending',
      avatar: userToAdd.avatar || ''
    });

    await board.update({ members });

    // Create notification for the added user
    const notification = await Notification.create({
      userId: userToAdd.id,
      message: `${req.user.name} has invited you to join the board: "${board.name}"`,
      type: 'added_to_board',
      boardId: board.id
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userToAdd.id}`).emit('new_notification', notification.toJSON ? notification.toJSON() : notification);
    }

    // Automatically send invite email
    await sendInviteEmail({
      to: userToAdd.email,
      inviterName: req.user.name,
      boardName: board.name,
      boardId: board.id
    });

    // Return updated board with populated owner for real-time UI update
    const updatedBoard = await Board.findByPk(board.id, {
      include: [{ model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] }]
    });
    const taskCount = await Task.count({ where: { boardId: board.id } });

    res.json({
      ...(updatedBoard.toJSON ? updatedBoard.toJSON() : updatedBoard),
      id: updatedBoard.id,
      taskCount
    });
  } catch (error) {
    console.error('❌ Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

/**
 * DELETE /api/boards/:id/members/:memberId
 * Remove a member from a board
 */
router.delete('/:id/members/:memberId', protect, async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const board = await Board.findByPk(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if requester is owner or the member themselves
    const isOwner = board.ownerId.toString() === req.user.id.toString();
    const isRemovingSelf = req.user.id.toString() === memberId.toString();

    if (!isOwner && !isRemovingSelf) {
      return res.status(403).json({ error: 'Not authorized to remove this member' });
    }

    // Find the member to get their name
    const membersList = board.members && Array.isArray(board.members) ? board.members : [];
    const removedMember = membersList.find(m => m.id && m.id.toString() === memberId.toString());
    const removedMemberName = removedMember ? removedMember.name : 'A member';

    // Remove member
    const updatedMembersList = membersList.filter(m => m.id && m.id.toString() !== memberId.toString());
    await board.update({ members: updatedMembersList });

    // Create notifications for owner and admins
    const notificationPromises = [];
    const notificationMessage = isRemovingSelf
      ? `${removedMemberName} has left the board "${board.name}"`
      : `${req.user.name} removed ${removedMemberName} from board "${board.name}"`;
    const notificationType = isRemovingSelf ? 'member_left' : 'member_removed';

    // Notify owner
    if (board.ownerId.toString() !== memberId.toString()) {
      notificationPromises.push(
        Notification.create({
          userId: board.ownerId,
          message: notificationMessage,
          type: notificationType,
          boardId: board.id
        })
      );
    }

    // Notify all admins
    updatedMembersList.forEach(m => {
      if (m.role === 'admin' && m.id && m.id.toString() !== memberId.toString()) {
        notificationPromises.push(
          Notification.create({
            userId: m.id,
            message: notificationMessage,
            type: notificationType,
            boardId: board.id
          })
        );
      }
    });

    const createdNotifications = await Promise.all(notificationPromises);

    // Socket emission
    const io = req.app.get('io');
    if (io) {
      createdNotifications.forEach(notif => {
        io.to(`user:${notif.userId}`).emit('new_notification', notif.toJSON ? notif.toJSON() : notif);
      });

      // Specific event for the removed member to trigger immediate UI redirect
      if (!isRemovingSelf && removedMember) {
        io.to(`user:${memberId}`).emit('you_were_removed', {
          boardId: board.id,
          boardName: board.name
        });
      }

      // Notify everyone about board update
      io.to(`board:${board.id}`).emit('board_updated', board.toJSON ? board.toJSON() : board);
    }

    res.json(board.toJSON ? board.toJSON() : board);
  } catch (error) {
    console.error('❌ Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * PUT /api/boards/:id/members/:memberId
 * Update a member's role
 */
router.put('/:id/members/:memberId', protect, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "member"' });
    }

    const board = await Board.findByPk(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Only board owner can change roles
    if (board.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Only board owner can change member roles' });
    }

    // Find the member
    const members = [...(board.members || [])];
    const member = members.find(m => m.id && m.id.toString() === memberId.toString());
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const oldRole = member.role;
    member.role = role;
    await board.update({ members });

    // Create notification for the member whose role was changed
    await Notification.create({
      userId: memberId,
      message: `Your role in board "${board.name}" was changed from ${oldRole} to ${role}`,
      type: 'role_changed',
      boardId: board.id
    });

    console.log(`✅ Member ${memberId} role updated to ${role} in board ${board.name}`);
    res.json(board);
  } catch (error) {
    console.error('❌ Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

/**
 * POST /api/boards/:id/members/accept
 * Accept a board invitation
 */
router.post('/:id/members/accept', protect, async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Find the member in the board's member list
    const members = [...(board.members || [])];
    const member = members.find(m =>
      m.id && m.id.toString() === req.user.id.toString()
    ) || members.find(m =>
      m.email === req.user.email
    );

    if (!member) {
      return res.status(404).json({ error: 'You are not an invited member of this board' });
    }

    // Update status and ensure ID is set (in case it was a placeholder)
    member.status = 'active';
    member.id = req.user.id;
    member.name = req.user.name;
    member.avatar = req.user.avatar || '';

    await board.update({ members });

    // Create notification for board owner
    const notification = await Notification.create({
      userId: board.ownerId,
      message: `${req.user.name} has joined the board "${board.name}"`,
      type: 'board_invite', // Reusing board_invite or we could use a new 'member_joined' type
      boardId: board.id
    });

    const io = req.app.get('io');
    if (io) {
      // Notify owner
      io.to(`user:${board.ownerId}`).emit('new_notification', notification.toJSON ? notification.toJSON() : notification);

      // Notify everyone about board update (member status change)
      io.to(`board:${board.id}`).emit('board_updated', board.toJSON ? board.toJSON() : board);
    }

    console.log(`✅ User ${req.user.email} accepted invitation to board "${board.name}"`);
    res.json(board.toJSON ? board.toJSON() : board);
  } catch (error) {
    console.error('❌ Accept invite error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

/**
 * POST /api/boards/:id/members/reject
 * Reject a board invitation
 */
router.post('/:id/members/reject', protect, async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Find the member in the board's member list
    const members = [...(board.members || [])];
    const member = members.find(m =>
      (m.id && m.id.toString() === req.user.id.toString()) ||
      (m.email === req.user.email)
    );

    if (!member) {
      return res.status(404).json({ error: 'You are not an invited member of this board' });
    }

    // Update status to rejected
    member.status = 'rejected';
    await board.update({ members });

    console.log(`❌ User ${req.user.email} rejected invitation to board "${board.name}"`);
    res.json({ message: 'Invitation rejected successfully' });
  } catch (error) {
    console.error('❌ Reject invite error:', error);
    res.status(500).json({ error: 'Failed to reject invitation' });
  }
});

export default router;