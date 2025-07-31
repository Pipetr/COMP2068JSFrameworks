const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const WorkEntry = require('../models/WorkEntry');
const { requireAuth } = require('../middleware/auth');

// Projects dashboard - Show user's projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.render('projects/index', {
      title: 'Projects - Work Tracker',
      projects,
      success: req.session.success,
      error: req.session.error
    });
    delete req.session.success;
    delete req.session.error;
  } catch (error) {
    console.error('Projects dashboard error:', error);
    req.session.error = 'Error loading projects';
    res.redirect('/work/dashboard');
  }
});

// Add project form
router.get('/add', requireAuth, (req, res) => {
  res.render('projects/add', {
    title: 'Add Project - Work Tracker',
    error: req.session.error
  });
  delete req.session.error;
});

// Create new project
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { name, description, hourlyRate, client, color } = req.body;

    // Validation
    if (!name || !hourlyRate) {
      req.session.error = 'Project name and hourly rate are required';
      return res.redirect('/projects/add');
    }

    if (parseFloat(hourlyRate) <= 0) {
      req.session.error = 'Hourly rate must be greater than 0';
      return res.redirect('/projects/add');
    }

    // Create new project
    const project = new Project({
      userId: req.user._id,
      name,
      description,
      hourlyRate: parseFloat(hourlyRate),
      client,
      color: color || '#667eea'
    });

    await project.save();

    req.session.success = 'Project created successfully!';
    res.redirect('/projects');
  } catch (error) {
    console.error('Add project error:', error);
    req.session.error = 'Error creating project';
    res.redirect('/projects/add');
  }
});

// Edit project form
router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!project) {
      req.session.error = 'Project not found';
      return res.redirect('/projects');
    }

    res.render('projects/edit', {
      title: 'Edit Project - Work Tracker',
      project,
      error: req.session.error
    });
    delete req.session.error;
  } catch (error) {
    console.error('Edit project error:', error);
    req.session.error = 'Error loading project';
    res.redirect('/projects');
  }
});

// Update project
router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, hourlyRate, client, status, color } = req.body;

    if (!name || name.trim() === '') {
      req.session.error = 'Project name is required';
      return res.redirect(`/projects/edit/${req.params.id}`);
    }

    if (parseFloat(hourlyRate) <= 0) {
      req.session.error = 'Hourly rate must be greater than 0';
      return res.redirect(`/projects/edit/${req.params.id}`);
    }

    // Get the current project first
    const currentProject = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!currentProject) {
      req.session.error = 'Project not found';
      return res.redirect('/projects');
    }

    // Prepare update object
    const updateData = {
      name,
      description,
      hourlyRate: parseFloat(hourlyRate),
      client,
      status,
      color: color || '#667eea'
    };

    // Add endDate if status is being changed to completed
    if (status === 'completed' && !currentProject.endDate) {
      updateData.endDate = new Date();
    }

    // Update project
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true }
    );

    if (!project) {
      req.session.error = 'Project not found';
      return res.redirect('/projects');
    }

    req.session.success = 'Project updated successfully!';
    res.redirect('/projects');
  } catch (error) {
    console.error('Update project error:', error);
    req.session.error = 'Error updating project';
    res.redirect(`/projects/edit/${req.params.id}`);
  }
});

// Delete project
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    // Check if project has work entries
    const workEntryCount = await WorkEntry.countDocuments({ 
      projectId: req.params.id,
      userId: req.user._id 
    });

    if (workEntryCount > 0) {
      req.session.error = 'Cannot delete project with existing work entries. Please delete all work entries first.';
      return res.redirect('/projects');
    }

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!project) {
      req.session.error = 'Project not found';
      return res.redirect('/projects');
    }

    req.session.success = 'Project deleted successfully!';
    res.redirect('/projects');
  } catch (error) {
    console.error('Delete project error:', error);
    req.session.error = 'Error deleting project';
    res.redirect('/projects');
  }
});

// Project details with work entries
router.get('/view/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!project) {
      req.session.error = 'Project not found';
      return res.redirect('/projects');
    }

    const workEntries = await WorkEntry.find({
      projectId: req.params.id,
      userId: req.user._id
    }).sort({ date: -1 });

    // Calculate project totals
    const totalHours = workEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const totalGrossEarnings = workEntries.reduce((sum, entry) => sum + entry.grossEarnings, 0);
    const totalNetEarnings = workEntries.reduce((sum, entry) => sum + entry.netEarnings, 0);

    res.render('projects/view', {
      title: `${project.name} - Work Tracker`,
      project,
      workEntries,
      totalHours: totalHours.toFixed(2),
      totalGrossEarnings: totalGrossEarnings.toFixed(2),
      totalNetEarnings: totalNetEarnings.toFixed(2),
      success: req.session.success,
      error: req.session.error
    });
    delete req.session.success;
    delete req.session.error;
  } catch (error) {
    console.error('Project view error:', error);
    req.session.error = 'Error loading project details';
    res.redirect('/projects');
  }
});

module.exports = router;
