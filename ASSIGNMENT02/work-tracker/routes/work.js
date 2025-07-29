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

module.exports = router;
