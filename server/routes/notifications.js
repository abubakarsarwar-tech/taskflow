import express from 'express';
import { Notification } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for a user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error('❌ Fetch notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', protect, async (req, res) => {
    try {
        const [updatedRowsCount] = await Notification.update(
            { read: true },
            { where: { id: req.params.id, userId: req.user.id } }
        );
        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        const notification = await Notification.findByPk(req.params.id);
        res.json(notification);
    } catch (error) {
        console.error('❌ Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.update(
            { read: true },
            { where: { userId: req.user.id, read: false } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('❌ Read all notifications error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a single notification
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const deletedCount = await Notification.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('❌ Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Delete all notifications for a user
 * @access  Private
 */
router.delete('/clear-all/all', protect, async (req, res) => {
    try {
        await Notification.destroy({ where: { userId: req.user.id } });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('❌ Clear all notifications error:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

export default router;
