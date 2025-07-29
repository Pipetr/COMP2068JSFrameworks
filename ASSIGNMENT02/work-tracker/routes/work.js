const express = require('express');
const router = express.Router();
const WorkEntry = require('../models/WorkEntry');
const { requireAuth } = require('../middleware/auth');

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

// Public view - Show all work entries (read-only)
router.get('/public', async (req, res) => {
  try {
    const workEntries = await WorkEntry.find()
      .populate('userId', 'firstName lastName')
      .sort({ date: -1 });

    res.render('work/public', {
      title: 'Public Work Entries - Work Tracker',
      workEntries
    });
  } catch (error) {
    console.error('Public view error:', error);
    res.render('error', { 
      message: 'Error loading public work entries',
      error: {}
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
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
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
      title: 'Upload Excel File - Work Tracker',
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

// Process Excel upload
router.post('/upload', requireAuth, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      req.session.error = 'Please select an Excel file to upload';
      return res.redirect('/work/upload');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    
    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    if (!worksheet) {
      req.session.error = 'No data found in the Excel file';
      return res.redirect('/work/upload');
    }

    const Project = require('../models/Project');
    const projects = await Project.find({ userId: req.user._id });
    const projectMap = {};
    projects.forEach(project => {
      projectMap[project.name.toLowerCase()] = project;
    });

    const results = {
      success: 0,
      errors: [],
      total: 0
    };

    // Process each row (skip header row)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      results.total++;
      
      try {
        // Expected columns: Project Name, Description, Date, Start Time, End Time, Break Time (optional)
        const projectName = row.getCell(1).value;
        const description = row.getCell(2).value;
        const date = row.getCell(3).value;
        const startTime = row.getCell(4).value;
        const endTime = row.getCell(5).value;
        const breakTime = row.getCell(6).value || 0;

        // Validation
        if (!projectName || !description || !date || !startTime || !endTime) {
          results.errors.push(`Row ${rowNumber}: Missing required fields`);
          return;
        }

        // Find matching project
        const project = projectMap[projectName.toString().toLowerCase()];
        if (!project) {
          results.errors.push(`Row ${rowNumber}: Project "${projectName}" not found`);
          return;
        }

        // Parse date
        let workDate;
        if (date instanceof Date) {
          workDate = date;
        } else {
          workDate = new Date(date);
        }
        
        if (isNaN(workDate.getTime())) {
          results.errors.push(`Row ${rowNumber}: Invalid date format`);
          return;
        }

        // Parse times (handle different formats)
        let startTimeStr, endTimeStr;
        if (typeof startTime === 'number') {
          // Excel time (fraction of a day)
          const hours = Math.floor(startTime * 24);
          const minutes = Math.floor((startTime * 24 * 60) % 60);
          startTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } else {
          startTimeStr = startTime.toString();
        }

        if (typeof endTime === 'number') {
          const hours = Math.floor(endTime * 24);
          const minutes = Math.floor((endTime * 24 * 60) % 60);
          endTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } else {
          endTimeStr = endTime.toString();
        }

        // Create work entry
        const workEntry = new WorkEntry({
          userId: req.user._id,
          projectId: project._id,
          project: project.name,
          description: description.toString(),
          date: new Date(workDate.toISOString().split('T')[0] + 'T12:00:00.000Z'),
          startTime: startTimeStr,
          endTime: endTimeStr,
          breakTime: parseInt(breakTime) || 0,
          hourlyRate: project.hourlyRate
        });

        // Save asynchronously
        workEntry.save()
          .then(() => results.success++)
          .catch(err => {
            results.errors.push(`Row ${rowNumber}: ${err.message}`);
          });

      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    });

    // Clean up uploaded file
    const fs = require('fs');
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
    console.error('Excel upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    req.session.error = 'Error processing Excel file: ' + error.message;
    res.redirect('/work/upload');
  }
});

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
