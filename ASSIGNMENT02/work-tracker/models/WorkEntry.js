const mongoose = require('mongoose');

const workEntrySchema = new mongoose.Schema({
  userId: {
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
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
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
  isOvertime: {
    type: Boolean,
    default: false
  },
  overtimeMultiplier: {
    type: Number,
    default: 1.0,
    min: 1.0,
    max: 3.0 // Allow up to triple time
  },
  effectiveHourlyRate: {
    type: Number,
    min: 0,
    default: 0
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
  },
  grossEarnings: {
    type: Number,
    min: 0,
    default: 0
  },
  federalTax: {
    type: Number,
    min: 0,
    default: 0
  },
  provincialTax: {
    type: Number,
    min: 0,
    default: 0
  },
  cppContribution: {
    type: Number,
    min: 0,
    default: 0
  },
  eiContribution: {
    type: Number,
    min: 0,
    default: 0
  },
  netEarnings: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual properties for formatted display
workEntrySchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

workEntrySchema.virtual('formattedEarnings').get(function() {
  return `$${this.totalEarnings.toFixed(2)}`;
});

workEntrySchema.virtual('formattedGrossEarnings').get(function() {
  return `$${this.grossEarnings.toFixed(2)}`;
});

workEntrySchema.virtual('formattedNetEarnings').get(function() {
  return `$${this.netEarnings.toFixed(2)}`;
});

workEntrySchema.virtual('formattedEffectiveRate').get(function() {
  return `$${this.effectiveHourlyRate.toFixed(2)}`;
});

workEntrySchema.virtual('overtimeLabel').get(function() {
  if (this.isOvertime) {
    if (this.overtimeMultiplier === 1.5) return 'Time & Half';
    if (this.overtimeMultiplier === 2.0) return 'Double Time';
    if (this.overtimeMultiplier === 3.0) return 'Triple Time';
    return `${this.overtimeMultiplier}x Rate`;
  }
  return 'Regular';
});

workEntrySchema.virtual('formattedBreakTime').get(function() {
  const hours = Math.floor(this.breakTime / 60);
  const minutes = this.breakTime % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

workEntrySchema.virtual('totalDeductions').get(function() {
  return this.federalTax + this.provincialTax + this.cppContribution + this.eiContribution;
});

workEntrySchema.virtual('formattedTotalDeductions').get(function() {
  return `$${this.totalDeductions.toFixed(2)}`;
});

module.exports = mongoose.model('WorkEntry', workEntrySchema);
