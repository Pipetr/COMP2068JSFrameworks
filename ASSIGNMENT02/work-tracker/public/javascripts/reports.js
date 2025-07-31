// Reports Dashboard JavaScript
let projectHoursChart, projectEarningsChart, timeSeriesChart;
let currentMetric = 'hours';

// Initial data from server (will be set by the HBS template)
let projectStats = {};
let dailyStats = {};

// Color palette for charts
const colors = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c',
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
  '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
];

function initCharts() {
  createProjectHoursChart();
  createProjectEarningsChart();
  createTimeSeriesChart();
}

function createProjectHoursChart() {
  const ctx = document.getElementById('projectHoursChart').getContext('2d');
  
  const projects = Object.keys(projectStats);
  const hours = projects.map(project => projectStats[project].hours.toFixed(2));
  
  if (projectHoursChart) {
    projectHoursChart.destroy();
  }
  
  projectHoursChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: projects,
      datasets: [{
        data: hours,
        backgroundColor: colors.slice(0, projects.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed + ' hours';
            }
          }
        }
      }
    }
  });
}

function createProjectEarningsChart() {
  const ctx = document.getElementById('projectEarningsChart').getContext('2d');
  
  const projects = Object.keys(projectStats);
  const earnings = projects.map(project => projectStats[project].earnings.toFixed(2));
  
  if (projectEarningsChart) {
    projectEarningsChart.destroy();
  }
  
  projectEarningsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: projects,
      datasets: [{
        data: earnings,
        backgroundColor: colors.slice(0, projects.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': $' + context.parsed;
            }
          }
        }
      }
    }
  });
}

function createTimeSeriesChart() {
  const ctx = document.getElementById('timeSeriesChart').getContext('2d');
  
  const dates = Object.keys(dailyStats).sort();
  const data = dates.map(date => dailyStats[date][currentMetric]);
  
  if (timeSeriesChart) {
    timeSeriesChart.destroy();
  }
  
  timeSeriesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(date => new Date(date).toLocaleDateString()),
      datasets: [{
        label: currentMetric === 'hours' ? 'Hours' : 'Earnings ($)',
        data: data,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: currentMetric === 'hours' ? 'Hours' : 'Earnings ($)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const suffix = currentMetric === 'hours' ? ' hours' : '';
              const prefix = currentMetric === 'earnings' ? '$' : '';
              return prefix + context.parsed.y.toFixed(2) + suffix;
            }
          }
        }
      }
    }
  });
}

function toggleChartType(chartName, type) {
  if (chartName === 'projectHours') {
    projectHoursChart.config.type = type;
    projectHoursChart.update();
  } else if (chartName === 'projectEarnings') {
    projectEarningsChart.config.type = type;
    projectEarningsChart.update();
  }
}

function toggleMetric(metric) {
  currentMetric = metric;
  createTimeSeriesChart();
}

async function updateCharts() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const projectId = document.getElementById('projectFilter').value;
  
  try {
    const response = await fetch(`/reports/api/chart-data?startDate=${startDate}&endDate=${endDate}&projectId=${projectId}`);
    const data = await response.json();
    
    projectStats = data.projectStats;
    dailyStats = data.dailyStats;
    
    // Update summary cards
    document.getElementById('totalHours').textContent = data.summary.totalHours.toFixed(2);
    document.getElementById('totalEarnings').textContent = '$' + data.summary.totalEarnings.toFixed(2);
    document.getElementById('totalEntries').textContent = data.summary.entriesCount;
    
    // Calculate average hourly rate
    const avgHourly = data.summary.totalEarnings / data.summary.totalHours || 0;
    document.getElementById('avgHourly').textContent = '$' + avgHourly.toFixed(2);
    
    // Recreate charts with new data
    createProjectHoursChart();
    createProjectEarningsChart();
    createTimeSeriesChart();
    
  } catch (error) {
    console.error('Error updating charts:', error);
    alert('Error updating charts. Please try again.');
  }
}

// Set initial data from server and initialize charts
function initializeReports() {
  // Read data from JSON script tags (safer than inline JS)
  const projectStatsElement = document.getElementById('project-stats-data');
  const dailyStatsElement = document.getElementById('daily-stats-data');
  
  if (projectStatsElement && dailyStatsElement) {
    try {
      projectStats = JSON.parse(projectStatsElement.textContent);
      dailyStats = JSON.parse(dailyStatsElement.textContent);
    } catch (error) {
      console.error('Error parsing server data:', error);
      projectStats = {};
      dailyStats = {};
    }
  }
  
  initCharts();
  
  // Calculate and display average hourly rate
  const totalHours = parseFloat(document.getElementById('totalHours').textContent);
  const totalEarnings = parseFloat(document.getElementById('totalEarnings').textContent.replace('$', ''));
  const avgHourly = totalEarnings / totalHours || 0;
  document.getElementById('avgHourly').textContent = '$' + avgHourly.toFixed(2);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeReports);
