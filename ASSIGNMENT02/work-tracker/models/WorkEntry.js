const mongoose = require('mongoose');

const workEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  breakTime: {
    type: Number,
    default: 0,
    min: 0,
    max: 480 // Maximum 8 hours break
  },
  project: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  totalHours: {
    type: Number,
    min: 0,
    default: 0
  },
  totalEarnings: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Helper function to parse time string to minutes
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Calculate total hours and earnings before saving
workEntrySchema.pre('save', function(next) {
  if (this.startTime && this.endTime && this.hourlyRate) {
    const start = parseTime(this.startTime);
    const end = parseTime(this.endTime);
    
    let totalMinutes = end - start;
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Handle overnight work
    }
    
    totalMinutes -= (this.breakTime || 0);
    this.totalHours = Math.max(0, totalMinutes / 60);
    this.totalEarnings = this.totalHours * this.hourlyRate;
  }
  next();
});

// Virtual for formatted date
workEntrySchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for formatted earnings
workEntrySchema.virtual('formattedEarnings').get(function() {
  return `$${this.totalEarnings.toFixed(2)}`;
});

module.exports = mongoose.model('WorkEntry', workEntrySchema);
