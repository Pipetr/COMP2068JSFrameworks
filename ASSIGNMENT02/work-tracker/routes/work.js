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
    const totalEarnings = workEntries.reduce((sum, entry) => sum + entry.totalEarnings, 0);

    res.render('work/dashboard', {
      title: 'Dashboard - Work Tracker',
      workEntries,
      totalHours: totalHours.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
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
router.get('/add', requireAuth, (req, res) => {
  res.render('work/add', {
    title: 'Add Work Entry - Work Tracker',
    error: req.session.error
  });
  delete req.session.error;
});

// Create new work entry
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { project, description, date, startTime, endTime, hourlyRate } = req.body;

    // Validation
    if (!project || !description || !date || !startTime || !endTime || !hourlyRate) {
      req.session.error = 'All fields are required';
      return res.redirect('/work/add');
    }

    if (parseFloat(hourlyRate) <= 0) {
      req.session.error = 'Hourly rate must be greater than 0';
      return res.redirect('/work/add');
    }

    // Create new work entry
    const workEntry = new WorkEntry({
      userId: req.user._id,
      project,
      description,
      date: new Date(date),
      startTime,
      endTime,
      hourlyRate: parseFloat(hourlyRate)
    });

    await workEntry.save();

    req.session.success = 'Work entry added successfully!';
    res.redirect('/work/dashboard');
  } catch (error) {
    console.error('Add work entry error:', error);
    req.session.error = 'Error adding work entry. Please check your input.';
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

    // Format date for HTML date input
    const formattedDate = workEntry.date.toISOString().split('T')[0];

    res.render('work/edit', {
      title: 'Edit Work Entry - Work Tracker',
      workEntry: {
        ...workEntry.toObject(),
        date: formattedDate
      },
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
    const { project, description, date, startTime, endTime, hourlyRate } = req.body;

    // Validation
    if (!project || !description || !date || !startTime || !endTime || !hourlyRate) {
      req.session.error = 'All fields are required';
      return res.redirect(`/work/edit/${req.params.id}`);
    }

    if (parseFloat(hourlyRate) <= 0) {
      req.session.error = 'Hourly rate must be greater than 0';
      return res.redirect(`/work/edit/${req.params.id}`);
    }

    // Update work entry
    const workEntry = await WorkEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        project,
        description,
        date: new Date(date),
        startTime,
        endTime,
        hourlyRate: parseFloat(hourlyRate)
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
    req.session.error = 'Error updating work entry. Please check your input.';
    res.redirect(`/work/edit/${req.params.id}`);
  }
});

// Delete work entry (with confirmation)
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    const workEntry = await WorkEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!workEntry) {
      req.session.error = 'Work entry not found';
    } else {
      req.session.success = 'Work entry deleted successfully!';
    }

    res.redirect('/work/dashboard');
  } catch (error) {
    console.error('Delete work entry error:', error);
    req.session.error = 'Error deleting work entry';
    res.redirect('/work/dashboard');
  }
});

// Public entries page (read-only)
router.get('/public', async (req, res) => {
  try {
    const workEntries = await WorkEntry.find()
      .populate('userId', 'firstName lastName')
      .sort({ date: -1 })
      .limit(20); // Limit to recent 20 entries

    res.render('work/public', {
      title: 'Recent Work Entries - Work Tracker',
      workEntries
    });
  } catch (error) {
    console.error('Public entries error:', error);
    res.render('work/public', {
      title: 'Recent Work Entries - Work Tracker',
      workEntries: [],
      error: 'Error loading work entries'
    });
  }
});

module.exports = router;
