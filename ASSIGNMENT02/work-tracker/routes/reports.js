const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const WorkEntry = require('../models/WorkEntry');
const Project = require('../models/Project');

// Reports dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get date range from query params (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get all work entries for the date range
    const workEntries = await WorkEntry.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('projectId');
    
    // Get all projects for the user
    const projects = await Project.find({ userId });
    
    // Calculate summary statistics
    const totalHours = workEntries.reduce((sum, entry) => {
      return sum + (entry.totalHours || 0);
    }, 0);
    
    const totalEarnings = workEntries.reduce((sum, entry) => {
      return sum + (entry.netEarnings || 0);
    }, 0);
    
    // Calculate total gross earnings for comparison
    const totalGrossEarnings = workEntries.reduce((sum, entry) => {
      return sum + (entry.grossEarnings || 0);
    }, 0);
    
    // Calculate total deductions
    const totalDeductions = workEntries.reduce((sum, entry) => {
      return sum + (entry.totalDeductions || 0);
    }, 0);
    
    // Calculate average hourly rate
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    
    // Group by project for chart data
    const projectStats = {};
    workEntries.forEach(entry => {
      const projectName = entry.project || 'Unknown';
      if (!projectStats[projectName]) {
        projectStats[projectName] = {
          hours: 0,
          earnings: 0,
          entries: 0
        };
      }
      
      projectStats[projectName].hours += entry.totalHours || 0;
      projectStats[projectName].earnings += entry.netEarnings || 0;
      projectStats[projectName].entries += 1;
    });
    
    // Group by date for time series
    const dailyStats = {};
    workEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          hours: 0,
          earnings: 0
        };
      }
      
      dailyStats[dateKey].hours += entry.totalHours || 0;
      dailyStats[dateKey].earnings += entry.netEarnings || 0;
    });
    
    res.render('reports/index', {
      title: 'Reports - Work Tracker',
      totalHours: totalHours.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
      avgHourly: avgHourlyRate.toFixed(2),
      projectStatsJson: JSON.stringify(projectStats),
      dailyStatsJson: JSON.stringify(dailyStats),
      projects,
      entriesCount: workEntries.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Reports error:', error);
    req.session.error = 'Error loading reports';
    res.redirect('/work/dashboard');
  }
});

// API endpoint for chart data
router.get('/api/chart-data', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, projectId } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    let projectFilter = {};
    if (projectId && projectId !== 'all') {
      projectFilter = { projectId };
    }
    
    const workEntries = await WorkEntry.find({
      userId,
      ...dateFilter,
      ...projectFilter
    }).populate('projectId');
    
    // Group by project
    const projectStats = {};
    workEntries.forEach(entry => {
      const projectName = entry.project || 'Unknown';
      if (!projectStats[projectName]) {
        projectStats[projectName] = {
          hours: 0,
          earnings: 0,
          entries: 0
        };
      }
      
      projectStats[projectName].hours += entry.totalHours || 0;
      projectStats[projectName].earnings += entry.netEarnings || 0;
      projectStats[projectName].entries += 1;
    });
    
    // Group by date
    const dailyStats = {};
    workEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          hours: 0,
          earnings: 0
        };
      }
      
      dailyStats[dateKey].hours += entry.totalHours || 0;
      dailyStats[dateKey].earnings += entry.netEarnings || 0;
    });
    
    res.json({
      projectStats,
      dailyStats,
      summary: {
        totalHours: workEntries.reduce((sum, entry) => {
          return sum + (entry.totalHours || 0);
        }, 0),
        totalEarnings: workEntries.reduce((sum, entry) => {
          return sum + (entry.netEarnings || 0);
        }, 0),
        entriesCount: workEntries.length
      }
    });
  } catch (error) {
    console.error('Chart data API error:', error);
    res.status(500).json({ error: 'Error loading chart data' });
  }
});

module.exports = router;
