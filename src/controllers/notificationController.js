import Notification from '../models/Notification.js';

export const subscribe = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, acceptNotifications, acceptPromotions } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!acceptNotifications) {
      return res.status(400).json({
        success: false,
        message: 'You must accept to receive notifications'
      });
    }

    // Check if email already exists
    const existingEmail = await Notification.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed'
      });
    }

    // Check if phone number already exists
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const existingPhone = await Notification.findOne({ phoneNumber: cleanPhone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already subscribed'
      });
    }

    // Create new notification subscription
    const notification = new Notification({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: cleanPhone,
      acceptNotifications,
      acceptPromotions: acceptPromotions || false
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to notifications',
      data: {
        id: notification._id,
        firstName: notification.firstName,
        lastName: notification.lastName,
        email: notification.email
      }
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    });
  }
};

export const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'active' } = req.query;

    const notifications = await Notification.find({ status })
      .sort({ subscribedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const count = await Notification.countDocuments({ status });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
};

export const getSubscriptionByEmail = async (req, res) => {
  try {
    const notification = await Notification.findOne({ 
      email: req.params.email.toLowerCase() 
    }).select('-__v');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Get by email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription'
    });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { email: req.params.email.toLowerCase() },
      { status: 'unsubscribed' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed',
      data: notification
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe'
    });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription'
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalSubscribers = await Notification.countDocuments({ status: 'active' });
    const totalUnsubscribed = await Notification.countDocuments({ status: 'unsubscribed' });
    const promotionOptIn = await Notification.countDocuments({ 
      status: 'active', 
      acceptPromotions: true 
    });

    res.json({
      success: true,
      data: {
        totalSubscribers,
        totalUnsubscribed,
        promotionOptIn,
        promotionOptInPercentage: totalSubscribers > 0 
          ? ((promotionOptIn / totalSubscribers) * 100).toFixed(2) 
          : 0
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
