const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

    time: {
      type: String,
      required: true,
      trim: true,
    },

    repeat: {
      type: String,
      enum: [
        'never',
        'hourly',
        'daily',
        'weekdays',
        'weekends',
        'weekly',
        'biweekly',
        'monthly',
        'quarterly',
        'semiannual',
        'yearly',
        'custom',
      ],
      default: 'never',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    createdByName: {
      type: String,
      required: true,
      trim: true,
    },

    notify24hBefore: {
      type: Boolean,
      default: true,
    },

    notify1hBefore: {
      type: Boolean,
      default: true,
    },

    notifyAtTime: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);