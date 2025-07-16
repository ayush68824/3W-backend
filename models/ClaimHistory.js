const mongoose = require('mongoose');

const claimHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  previousTotalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  newTotalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClaimHistory', claimHistorySchema); 