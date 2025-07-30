const express = require('express');
const router = express.Router();
const WorkEntry = require('../models/WorkEntry');
const { requireAuth } = require('../middleware/auth');

// Root route - redirect to dashboard
router.get('/', requireAuth, (req, res) => {
  res.redirect('/work/dashboard');
});

// Dashboard - Show user's work entries
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const workEntries = await WorkEntry.find({ userId: req.user._id })
      .sort({ date: -1 });

    // Calculate totals
    const totalHours = workEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const totalGrossEarnings = workEntries.reduce((sum, entry) => sum + entry.grossEarnings, 0);
    const totalNetEarnings = workEntries.reduce((sum, entry) => sum + entry.netEarnings, 0);
    const totalDeductions = workEntries.reduce((sum, entry) => sum + entry.totalDeductions, 0);
    const totalEarnings = totalGrossEarnings; // For backward compatibility

    res.render('work/dashboard', {
      title: 'Dashboard - Work Tracker',
      workEntries,
      totalHours: totalHours.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
      totalGrossEarnings: totalGrossEarnings.toFixed(2),
      totalNetEarnings: totalNetEarnings.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      success: req.session.success,
      error: req.session.error
    });
    delete req.session.success;
    delete req.session.error;
  } catch (error) {
    console.error('Dashboard error:', error);
    req.session.error = 'Error loading dashboard';
    res.redirect('/');
  }
});

// Add work entry form
router.get('/add', requireAuth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const projects = await Project.find({ 
      userId: req.user._id, 
      status: 'active' 
    }).sort({ name: 1 });

    res.render('work/add', {
      title: 'Add Work Entry - Work Tracker',
      projects,
      error: req.session.error
    });
    delete req.session.error;
  } catch (error) {
    console.error('Add work entry form error:', error);
    req.session.error = 'Error loading projects';
    res.redirect('/work/dashboard');
  }
});

// Create new work entry
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { projectId, description, date, startTime, endTime, breakTime } = req.body;

    // Validation
    if (!projectId || !description || !date || !startTime || !endTime) {
      req.session.error = 'All fields are required';
      return res.redirect('/work/add');
    }

    const breakTimeMinutes = parseInt(breakTime) || 0;
    if (breakTimeMinutes < 0 || breakTimeMinutes > 480) {
      req.session.error = 'Break time must be between 0 and 480 minutes';
      return res.redirect('/work/add');
    }

    // Get project details to get hourly rate and name
    const Project = require('../models/Project');
    const project = await Project.findOne({ 
      _id: projectId, 
      userId: req.user._id 
    });

    if (!project) {
      req.session.error = 'Selected project not found';
      return res.redirect('/work/add');
    }

    // Create new work entry
    const workEntry = new WorkEntry({
      userId: req.user._id,
      projectId: project._id,
      project: project.name,
      description,
      date: new Date(date + 'T12:00:00.000Z'), // Set to noon UTC to avoid timezone issues
      startTime,
      endTime,
      breakTime: breakTimeMinutes,
      hourlyRate: project.hourlyRate
    });

    await workEntry.save();

    req.session.success = 'Work entry added successfully!';
    res.redirect('/work/dashboard');
  } catch (error) {
    console.error('Add work entry error:', error);
    req.session.error = 'Error adding work entry';
    res.redirect('/work/add');
  }
});

// Edit work entry form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const workEntry = await WorkEntry.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!workEntry) {
      req.session.error = 'Work entry not found';
      return res.redirect('/work/dashboard');
    }

    // Get all projects for the dropdown
    const Project = require('../models/Project');
    const projects = await Project.find({ userId: req.user._id }).sort({ name: 1 });

    // Format date for HTML date input
    const formattedDate = workEntry.date.toISOString().split('T')[0];

    res.render('work/edit', {
      title: 'Edit Work Entry - Work Tracker',
      workEntry: {
        ...workEntry.toObject(),
        date: formattedDate
      },
      projects,
      error: req.session.error
    });
    delete req.session.error;
  } catch (error) {
    console.error('Edit work entry error:', error);
    req.session.error = 'Error loading work entry';
    res.redirect('/work/dashboard');
  }
});

// Update work entry
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { projectId, description, date, startTime, endTime, breakTime } = req.body;

    // Validation
    if (!projectId || !description || !date || !startTime || !endTime) {
      req.session.error = 'All fields are required';
      return res.redirect(`/work/edit/${req.params.id}`);
    }

    const breakTimeMinutes = parseInt(breakTime) || 0;
    if (breakTimeMinutes < 0 || breakTimeMinutes > 480) {
      req.session.error = 'Break time must be between 0 and 480 minutes';
      return res.redirect(`/work/edit/${req.params.id}`);
    }

    // Get project details to get hourly rate and name
    const Project = require('../models/Project');
    const project = await Project.findOne({ 
      _id: projectId, 
      userId: req.user._id 
    });

    if (!project) {
      req.session.error = 'Selected project not found';
      return res.redirect(`/work/edit/${req.params.id}`);
    }

    // Update work entry
    const workEntry = await WorkEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        projectId: project._id,
        project: project.name,
        description,
        date: new Date(date + 'T12:00:00.000Z'), // Set to noon UTC to avoid timezone issues
        startTime,
        endTime,
        breakTime: breakTimeMinutes,
        hourlyRate: project.hourlyRate
      },
      { new: true }
    );

    if (!workEntry) {
      req.session.error = 'Work entry not found';
      return res.redirect('/work/dashboard');
    }

    req.session.success = 'Work entry updated successfully!';
    res.redirect('/work/dashboard');
  } catch (error) {
    console.error('Update work entry error:', error);
    req.session.error = 'Error updating work entry';
    res.redirect(`/work/edit/${req.params.id}`);
  }
});

// Delete work entry
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    const workEntry = await WorkEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!workEntry) {
      req.session.error = 'Work entry not found';
      return res.redirect('/work/dashboard');
    }

    req.session.success = 'Work entry deleted successfully!';
    res.redirect('/work/dashboard');
  } catch (error) {
    console.error('Delete work entry error:', error);
    req.session.error = 'Error deleting work entry';
    res.redirect('/work/dashboard');
  }
});

// Public view - Show platform statistics (anonymized)
router.get('/public', async (req, res) => {
  try {
    // Get anonymized statistics
    const User = require('../models/User');
    const Project = require('../models/Project');
    
    // Get basic counts with error handling
    let totalUsers = 0;
    let totalProjects = 0;
    let totalWorkEntries = 0;
    let activeProjects = 0;
    let totalHoursWorked = 0;
    let avgHourlyRate = 0;
    let recentStats = [];

    try {
      totalUsers = await User.countDocuments() || 0;
    } catch (err) {
      console.log('Error counting users:', err.message);
    }

    try {
      totalProjects = await Project.countDocuments() || 0;
    } catch (err) {
      console.log('Error counting projects:', err.message);
    }

    try {
      totalWorkEntries = await WorkEntry.countDocuments() || 0;
    } catch (err) {
      console.log('Error counting work entries:', err.message);
    }

    try {
      activeProjects = await Project.countDocuments({ status: 'active' }) || 0;
    } catch (err) {
      console.log('Error counting active projects:', err.message);
    }

    // Only do aggregations if we have work entries
    if (totalWorkEntries > 0) {
      try {
        const totalHoursResult = await WorkEntry.aggregate([
          { $group: { _id: null, total: { $sum: '$totalHours' } } }
        ]);
        totalHoursWorked = totalHoursResult[0]?.total || 0;
      } catch (err) {
        console.log('Error aggregating total hours:', err.message);
      }

      try {
        const avgRateResult = await WorkEntry.aggregate([
          { $group: { _id: null, avgRate: { $avg: '$hourlyRate' } } }
        ]);
        avgHourlyRate = avgRateResult[0]?.avgRate || 0;
      } catch (err) {
        console.log('Error aggregating average rate:', err.message);
      }

      try {
        recentStats = await WorkEntry.aggregate([
          { $match: { date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              entriesCount: { $sum: 1 },
              totalHours: { $sum: '$totalHours' }
            }
          },
          { $sort: { '_id': -1 } },
          { $limit: 7 }
        ]);
      } catch (err) {
        console.log('Error aggregating recent stats:', err.message);
        recentStats = [];
      }
    }

    const stats = {
      totalUsers,
      totalProjects,
      totalWorkEntries,
      totalHoursWorked: totalHoursWorked.toFixed(2),
      activeProjects,
      avgHourlyRate: avgHourlyRate.toFixed(2),
      recentActivity: recentStats || []
    };

    res.render('work/public', {
      title: 'Work Tracker - Platform Statistics',
      stats,
      isAuthenticated: !!req.user
    });
  } catch (error) {
    console.error('Public view error:', error);
    res.render('error', { 
      message: 'Error loading platform statistics',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Excel upload functionality
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept CSV and Excel files
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload form
router.get('/upload', requireAuth, async (req, res) => {
  try {
    // Get all projects for mapping
    const Project = require('../models/Project');
    const projects = await Project.find({ userId: req.user._id }).sort({ name: 1 });
    
    res.render('work/upload', {
      title: 'Upload Work Hours - Work Tracker',
      projects,
      error: req.session.error,
      success: req.session.success
    });
    delete req.session.error;
    delete req.session.success;
  } catch (error) {
    console.error('Upload form error:', error);
    req.session.error = 'Error loading upload form';
    res.redirect('/work/dashboard');
  }
});

// Process CSV/Excel upload
router.post('/upload', requireAuth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      req.session.error = 'Please select a CSV or Excel file to upload';
      return res.redirect('/work/upload');
    }

    if (!req.body.projectId) {
      req.session.error = 'Please select a project for the import';
      return res.redirect('/work/upload');
    }

    // Get the selected project
    const Project = require('../models/Project');
    const project = await Project.findOne({ 
      _id: req.body.projectId, 
      userId: req.user._id 
    });

    if (!project) {
      req.session.error = 'Selected project not found';
      return res.redirect('/work/upload');
    }

    const results = {
      success: 0,
      errors: [],
      total: 0
    };

    const fs = require('fs');
    const csv = require('csv-parser');
    const path = require('path');

    // Determine file type and process accordingly
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (fileExtension === '.csv') {
      // Process CSV file
      await new Promise((resolve, reject) => {
        const csvResults = [];
        
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => csvResults.push(data))
          .on('end', async () => {
            try {
              for (let i = 0; i < csvResults.length; i++) {
                const row = csvResults[i];
                const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header
                
                try {
                  await processWorkEntry(row, rowNumber, project, req.user._id, results);
                } catch (error) {
                  results.errors.push(`Row ${rowNumber}: ${error.message}`);
                }
                results.total++;
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject);
      });
    } else {
      // Process Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        req.session.error = 'No data found in the Excel file';
        return res.redirect('/work/upload');
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        results.total++;
        
        try {
          // Convert Excel row to CSV-like object
          const data = {
            'Date': row.getCell(1).value,
            'Start Time': row.getCell(2).value,
            'End Time': row.getCell(3).value,
            'Total Hours': row.getCell(4).value
          };
          
          processWorkEntry(data, rowNumber, project, req.user._id, results);
        } catch (error) {
          results.errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Prepare results message
    let message = `Upload completed: ${results.success} entries processed successfully`;
    if (results.errors.length > 0) {
      message += `. ${results.errors.length} errors occurred.`;
      req.session.uploadErrors = results.errors;
    }

    req.session.success = message;
    res.redirect('/work/upload');

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    req.session.error = 'Error processing file: ' + error.message;
    res.redirect('/work/upload');
  }
});

// Helper function to process individual work entry
async function processWorkEntry(data, rowNumber, project, userId, results) {
  // Extract data from your CSV format
  const date = data['Date'];
  const startTime = data['Start Time'];
  const endTime = data['End Time'];
  const totalHours = parseFloat(data['Total Hours']);

  // Validation
  if (!date || !startTime || !endTime) {
    throw new Error('Missing required fields (Date, Start Time, End Time)');
  }

  if (isNaN(totalHours) || totalHours <= 0) {
    throw new Error('Invalid or missing Total Hours value');
  }

  // Parse date
  let workDate;
  if (date instanceof Date) {
    workDate = date;
  } else {
    workDate = new Date(date);
  }
  
  if (isNaN(workDate.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  // Parse times
  let startTimeStr = parseTimeValue(startTime);
  let endTimeStr = parseTimeValue(endTime);

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTimeStr)) {
    throw new Error(`Invalid start time format: ${startTimeStr}. Expected HH:MM`);
  }
  if (!timeRegex.test(endTimeStr)) {
    throw new Error(`Invalid end time format: ${endTimeStr}. Expected HH:MM`);
  }

  // Calculate actual end time and break time based on total hours
  // The CSV end time already has break deducted, so we need to add it back
  let breakTimeMinutes;
  let actualEndTimeStr;

  if (totalHours > 10) {
    // For work sessions over 10 hours, there's a 60-minute break
    breakTimeMinutes = 60;
    actualEndTimeStr = addMinutesToTime(endTimeStr, 60);
  } else {
    // For work sessions 10 hours or less, there's a 30-minute break
    breakTimeMinutes = 30;
    actualEndTimeStr = addMinutesToTime(endTimeStr, 30);
  }

  // Create work entry with actual times (break time included)
  const workEntry = new WorkEntry({
    userId: userId,
    projectId: project._id,
    project: project.name,
    description: `Imported work session - ${project.name}`,
    date: new Date(workDate.toISOString().split('T')[0] + 'T12:00:00.000Z'),
    startTime: startTimeStr,
    endTime: actualEndTimeStr,
    breakTime: breakTimeMinutes,
    hourlyRate: project.hourlyRate
  });

  await workEntry.save();
  results.success++;
}

// Helper function to parse time values (handles both string and Excel time formats)
function parseTimeValue(timeValue) {
  if (typeof timeValue === 'number') {
    // Excel time (fraction of a day)
    const hours = Math.floor(timeValue * 24);
    const minutes = Math.floor((timeValue * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    // String time - ensure it's in HH:MM format
    const timeStr = timeValue.toString().trim();
    // Handle formats like "4:00" -> "04:00"
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return timeStr;
  }
}

// Helper function to add minutes to a time string (HH:MM format)
function addMinutesToTime(timeStr, minutesToAdd) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Convert to total minutes, add the break time, then convert back
  let totalMinutes = (hours * 60) + minutes + minutesToAdd;
  
  // Handle day overflow (24+ hours)
  totalMinutes = totalMinutes % (24 * 60);
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Download sample Excel template
router.get('/download-template', requireAuth, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Work Entries Template');

    // Add headers
    worksheet.columns = [
      { header: 'Project Name', key: 'project', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Start Time', key: 'startTime', width: 12 },
      { header: 'End Time', key: 'endTime', width: 12 },
      { header: 'Break Time (minutes)', key: 'breakTime', width: 18 }
    ];

    // Add sample data
    const Project = require('../models/Project');
    const projects = await Project.find({ userId: req.user._id }).limit(3);
    
    const sampleData = [
      {
        project: projects[0]?.name || 'Sample Project',
        description: 'Sample work description',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        breakTime: 60
      },
      {
        project: projects[1]?.name || 'Another Project',
        description: 'Another sample description',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        startTime: '10:00',
        endTime: '18:00',
        breakTime: 30
      }
    ];

    worksheet.addRows(sampleData);

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add instructions worksheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [
      { header: 'Instructions for uploading work entries', key: 'instruction', width: 60 }
    ];

    const instructions = [
      '',
      '1. Use the "Work Entries Template" sheet to enter your data',
      '2. Project Name: Must match exactly with your existing projects',
      '3. Description: Brief description of the work performed',
      '4. Date: Use YYYY-MM-DD format (e.g., 2025-01-15)',
      '5. Start Time: Use HH:MM format (e.g., 09:00)',
      '6. End Time: Use HH:MM format (e.g., 17:00)',
      '7. Break Time: Enter in minutes (e.g., 60 for 1 hour break)',
      '',
      'Your existing projects:',
      ...projects.map(p => `- ${p.name} ($${p.hourlyRate}/hr)`),
      '',
      'Note: Hourly rates will be automatically assigned based on your project settings.'
    ];

    instructions.forEach(instruction => {
      instructionsSheet.addRow({ instruction });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=work-entries-template.xlsx');

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Template download error:', error);
    req.session.error = 'Error generating template file';
    res.redirect('/work/upload');
  }
});

module.exports = router;
