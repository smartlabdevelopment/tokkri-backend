import express from 'express';
import { subscribe, getAllSubscriptions, getSubscriptionByEmail, unsubscribe, deleteSubscription, getStats } from '../controllers/notificationController.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Notification routes
router.post('/subscribe', subscribe);
router.get('/all', getAllSubscriptions);
router.get('/email/:email', getSubscriptionByEmail);
router.put('/unsubscribe/:email', unsubscribe);
router.delete('/:id', deleteSubscription);
router.get('/stats', getStats);

export default router;
