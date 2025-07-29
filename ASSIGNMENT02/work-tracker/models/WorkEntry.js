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

// Helper function to parse time string to minutes
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Canadian tax calculation functions (2025 rates)
function calculateFederalTax(annualIncome) {
  if (annualIncome <= 53359) return annualIncome * 0.15;
  if (annualIncome <= 106717) return 8003.85 + (annualIncome - 53359) * 0.205;
  if (annualIncome <= 165430) return 18942.59 + (annualIncome - 106717) * 0.26;
  if (annualIncome <= 235675) return 34208.69 + (annualIncome - 165430) * 0.29;
  return 54570.74 + (annualIncome - 235675) * 0.33;
}

function calculateProvincialTax(annualIncome, province = 'ON') {
  // Ontario tax rates for 2025
  if (province === 'ON') {
    if (annualIncome <= 51446) return annualIncome * 0.0505;
    if (annualIncome <= 102894) return 2598.02 + (annualIncome - 51446) * 0.0915;
    if (annualIncome <= 150000) return 7300.51 + (annualIncome - 102894) * 0.1116;
    if (annualIncome <= 220000) return 12549.95 + (annualIncome - 150000) * 0.1216;
    return 21069.95 + (annualIncome - 220000) * 0.1316;
  }
  return annualIncome * 0.10; // Default 10% for other provinces
}

function calculateCPP(annualIncome) {
  const maxContributableEarnings = 71300; // 2025 CPP maximum
  const basicExemption = 3500;
  const contributionRate = 0.0595;
  
  if (annualIncome <= basicExemption) return 0;
  const contributableIncome = Math.min(annualIncome - basicExemption, maxContributableEarnings - basicExemption);
  return contributableIncome * contributionRate;
}

function calculateEI(annualIncome) {
  const maxInsurableEarnings = 67300; // 2025 EI maximum
  const contributionRate = 0.0188;
  
  const insurable = Math.min(annualIncome, maxInsurableEarnings);
  return insurable * contributionRate;
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
    
    // Subtract break time (in minutes)
    totalMinutes -= (this.breakTime || 0);
    this.totalHours = Math.max(0, totalMinutes / 60);
    
    // Calculate gross earnings
    this.grossEarnings = this.totalHours * this.hourlyRate;
    
    // Estimate annual income based on this hourly rate (assuming 40 hours/week)
    const estimatedAnnualIncome = this.hourlyRate * 40 * 52;
    
    // Calculate annual tax amounts
    const annualFederalTax = calculateFederalTax(estimatedAnnualIncome);
    const annualProvincialTax = calculateProvincialTax(estimatedAnnualIncome);
    const annualCPP = calculateCPP(estimatedAnnualIncome);
    const annualEI = calculateEI(estimatedAnnualIncome);
    
    // Calculate hourly deduction rates
    const annualHours = 40 * 52; // 2080 hours
    const federalTaxRate = annualFederalTax / annualHours;
    const provincialTaxRate = annualProvincialTax / annualHours;
    const cppRate = annualCPP / annualHours;
    const eiRate = annualEI / annualHours;
    
    // Apply deductions to this work entry
    this.federalTax = this.totalHours * federalTaxRate;
    this.provincialTax = this.totalHours * provincialTaxRate;
    this.cppContribution = this.totalHours * cppRate;
    this.eiContribution = this.totalHours * eiRate;
    
    // Calculate net earnings
    this.netEarnings = this.grossEarnings - this.federalTax - this.provincialTax - this.cppContribution - this.eiContribution;
    
    // Keep totalEarnings as gross for backward compatibility
    this.totalEarnings = this.grossEarnings;
  }
  next();
});

// Virtual for formatted date
workEntrySchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for formatted earnings
workEntrySchema.virtual('formattedEarnings').get(function() {
  return `$${this.totalEarnings.toFixed(2)}`;
});

// Virtual for formatted gross earnings
workEntrySchema.virtual('formattedGrossEarnings').get(function() {
  return `$${this.grossEarnings.toFixed(2)}`;
});

// Virtual for formatted net earnings
workEntrySchema.virtual('formattedNetEarnings').get(function() {
  return `$${this.netEarnings.toFixed(2)}`;
});

// Virtual for formatted break time
workEntrySchema.virtual('formattedBreakTime').get(function() {
  const hours = Math.floor(this.breakTime / 60);
  const minutes = this.breakTime % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for total deductions
workEntrySchema.virtual('totalDeductions').get(function() {
  return this.federalTax + this.provincialTax + this.cppContribution + this.eiContribution;
});

// Virtual for formatted total deductions
workEntrySchema.virtual('formattedTotalDeductions').get(function() {
  return `$${this.totalDeductions.toFixed(2)}`;
});

module.exports = mongoose.model('WorkEntry', workEntrySchema);
