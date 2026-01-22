const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getUnreadNotifications, getAllNotifications, markAsRead, markAllAsRead, deleteAllNotifications } = require('../controllers/notification.controller');

router.get('/unread', authMiddleware, getUnreadNotifications);
router.get('/all', authMiddleware, getAllNotifications);
router.put('/:notificationId/read', authMiddleware, markAsRead);
router.put('/read-all', authMiddleware, markAllAsRead);
router.delete('/all', authMiddleware, deleteAllNotifications);

module.exports = router;
