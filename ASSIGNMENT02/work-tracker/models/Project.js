const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  client: {
    type: String,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  color: {
    type: String,
    default: '#667eea',
    match: /^#[0-9A-F]{6}$/i
  }
}, {
  timestamps: true
});

// Virtual for formatted hourly rate
projectSchema.virtual('formattedHourlyRate').get(function() {
  return `$${this.hourlyRate.toFixed(2)}`;
});

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  const start = this.startDate;
  const end = this.endDate || new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
  }
});

// Virtual for formatted dates
projectSchema.virtual('formattedStartDate').get(function() {
  return this.startDate.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

projectSchema.virtual('formattedEndDate').get(function() {
  if (!this.endDate) return 'Ongoing';
  return this.endDate.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

module.exports = mongoose.model('Project', projectSchema);
