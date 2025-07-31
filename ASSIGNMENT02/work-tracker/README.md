# Work Tracker

A comprehensive work time tracking and project management application built with Express.js and MongoDB. Track your work hours, manage projects with different hourly rates, visualize your productivity with interactive charts, and import data from Excel spreadsheets.

## 🌐 Live Application

**Live Site:** [https://your-app-name.onrender.com](https://your-app-name.onrender.com)

*Note: Replace with your actual deployment URL*

## 📋 Assignment Requirements Completed

This application fulfills all COMP2068 Assignment #2 requirements:

1. **✅ Express Application with HBS templating**
2. **✅ Professional CSS design using Bootstrap**
3. **✅ Splash page with shared header/footer**
4. **✅ Public read-only page (Platform Statistics)**
5. **✅ User registration and login system**
6. **✅ GitHub OAuth authentication**
7. **✅ MongoDB cloud database with config separation**
8. **✅ Full CRUD operations for authenticated users**
9. **✅ Delete confirmation modals**
10. **✅ Additional Feature: Advanced File Upload System**

## 🎯 Additional Feature: Intelligent CSV/Excel Import System

**Feature Description:** Advanced file upload system with intelligent data processing capabilities.

**Key Capabilities:**
- **Smart Break Time Processing**: Automatically adjusts imported time entries based on work duration (30 min for ≤10 hours, 60 min for >10 hours)
- **Multi-Format Support**: Handles CSV, XLSX, and XLS file formats
- **Project Association**: Links imported entries to selected projects with automatic hourly rate assignment
- **Data Validation**: Comprehensive validation with detailed error reporting
- **User's Format Adaptation**: Specifically designed to handle the user's existing CSV format: `Date,Start Time,End Time,Total Hours,Period,total-hrs,amount,amount_after_taxes,additional,actual payment`
- **Visual Upload Interface**: Modern drag-and-drop interface with real-time feedback

This feature demonstrates independent learning in:
- File processing with `multer` and `csv-parser`
- Complex data transformation logic
- User experience design for bulk operations
- Integration with existing project management system

## 🚀 Features

### ⏰ Time Tracking
- **Precise Work Entries**: Track start/end times with automatic duration calculation
- **Break Time Management**: Record break times with tax-compliant deductions
- **Project-Based Tracking**: Assign work entries to specific projects
- **Real-time Calculations**: Live preview of earnings with tax estimations

### 📊 Project Management
- **Multiple Projects**: Manage unlimited projects with individual hourly rates
- **Project Details**: Track client information, project status, and timelines
- **Color Coding**: Visual organization with customizable project colors
- **Status Management**: Active, completed, on-hold, and cancelled project states

### 📈 Advanced Analytics & Reports
- **Interactive Charts**: Powered by Chart.js for dynamic data visualization
- **Multiple Chart Types**: Pie charts, bar charts, doughnut charts, and line graphs
- **Time Series Analysis**: Daily work pattern visualization
- **Project Distribution**: Hours and earnings breakdown by project
- **Flexible Filtering**: Filter by date range and specific projects
- **Real-time Updates**: Charts update dynamically based on filters

### 📄 Excel Integration
- **Bulk Import**: Upload Excel files to import multiple work entries
- **Template Download**: Pre-formatted Excel template with your projects
- **Drag & Drop Interface**: Modern file upload with visual feedback
- **Smart Validation**: Automatic project matching and data validation
- **Error Reporting**: Detailed feedback on import issues

### 💰 Canadian Tax Integration
- **Federal Tax Calculation**: Progressive tax rates based on income brackets
- **Provincial Tax (Ontario)**: Accurate provincial tax calculations
- **CPP & EI Deductions**: Canada Pension Plan and Employment Insurance
- **Real-time Estimates**: Live tax calculations during entry creation
- **Net Earnings Display**: See take-home pay after deductions

### 🔐 Security & Authentication
- **User Registration & Login**: Secure account management with Passport.js
- **Session Management**: Persistent login sessions with MongoDB storage
- **Data Privacy**: User-specific data isolation
- **Input Validation**: Comprehensive server-side validation
- **CSRF Protection**: Form security with session-based tokens

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 4.21.2** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose 8.16.5** - MongoDB object modeling

### Frontend
- **Handlebars (HBS)** - Template engine
- **Bootstrap 5** - UI framework
- **Chart.js** - Data visualization
- **Font Awesome** - Icons

### File Processing
- **ExcelJS** - Excel file processing (secure alternative to xlsx)
- **Multer** - File upload handling

### Authentication
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing
- **express-session** - Session management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 14 or higher)
- **MongoDB** (running locally or MongoDB Atlas connection)
- **Git** (for cloning the repository)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd work-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/worktracker
   
   # Session Configuration
   SESSION_SECRET=your-secret-key-here
   
   # Application Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or ensure your MongoDB Atlas connection is configured
   ```

5. **Initialize the application**
   ```bash
   npm start
   ```

6. **Access the application**
   
   Open your browser and navigate to: `http://localhost:3000`

## 📖 Usage Guide

### Getting Started

1. **Create an Account**
   - Navigate to the registration page
   - Fill in your details (first name, last name, email, password)
   - Complete the registration process

2. **Set Up Your First Project**
   - Go to "Projects" in the navigation
   - Click "Add New Project"
   - Enter project details:
     - Project name
     - Description
     - Hourly rate
     - Client information
     - Project status

3. **Track Your Work**
   - Click "Add Entry" in the navigation
   - Select your project from the dropdown
   - Enter work details:
     - Description of work performed
     - Date
     - Start and end times
     - Break time (optional)
   - The system automatically calculates earnings and tax estimates

### Advanced Features

#### Using Reports & Analytics
1. Navigate to "Reports" in the main menu
2. Use the filter controls to adjust:
   - Date range
   - Specific projects
3. View different chart types:
   - Hours distribution by project
   - Earnings breakdown
   - Daily work patterns
4. Switch between chart types using the control buttons

#### Excel Import Process
1. **Prepare Your Data**
   - Download the Excel template from the upload page
   - Fill in your work entries following the format
   - Ensure project names match exactly

2. **Upload Your File**
   - Go to "Upload Excel" in the navigation
   - Drag and drop your file or click to browse
   - Review the upload results and any error messages

3. **Template Format**
   ```
   Project Name | Description | Date | Start Time | End Time | Break Time
   Web Project  | Bug fixes   | 2025-01-15 | 09:00 | 17:00 | 60
   ```

#### Managing Projects
- **Edit Projects**: Update hourly rates, status, or details
- **Archive Projects**: Set status to "completed" or "cancelled"
- **Color Coding**: Assign colors for better visual organization
- **Delete Projects**: Remove projects (only if no work entries exist)

## 🏗️ Project Structure

```
work-tracker/
├── app.js                 # Main application file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
│
├── bin/
│   └── www               # Application startup script
│
├── config/
│   ├── database.js       # MongoDB connection configuration
│   └── passport.js       # Authentication strategies
│
├── middleware/
│   └── auth.js           # Authentication middleware
│
├── models/
│   ├── User.js           # User data model
│   ├── Project.js        # Project data model
│   └── WorkEntry.js      # Work entry data model
│
├── routes/
│   ├── index.js          # Home page routes
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   ├── projects.js       # Project CRUD routes
│   ├── work.js           # Work entry routes + Excel upload
│   └── reports.js        # Analytics and reporting routes
│
├── views/
│   ├── layout.hbs        # Main layout template
│   ├── index.hbs         # Home page
│   ├── error.hbs         # Error page
│   │
│   ├── auth/
│   │   ├── login.hbs     # Login form
│   │   └── register.hbs  # Registration form
│   │
│   ├── projects/
│   │   ├── index.hbs     # Projects list
│   │   └── add.hbs       # Add/edit project form
│   │
│   ├── work/
│   │   ├── dashboard.hbs # Work entries dashboard
│   │   ├── add.hbs       # Add work entry form
│   │   ├── edit.hbs      # Edit work entry form
│   │   ├── upload.hbs    # Excel upload interface
│   │   └── public.hbs    # Public work entries view
│   │
│   └── reports/
│       └── index.hbs     # Analytics dashboard
│
├── public/
│   ├── stylesheets/
│   │   └── style.css     # Custom styles
│   ├── javascripts/      # Client-side scripts
│   └── images/           # Static images
│
└── uploads/              # Temporary file storage for Excel uploads
```

## 🔧 Configuration

### Database Configuration
The application uses MongoDB for data storage. Configure your connection in `config/database.js` or via environment variables:

```javascript
// Local MongoDB
MONGODB_URI=mongodb://localhost:27017/worktracker

// MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worktracker
```

### Session Configuration
Configure session management for authentication:

```javascript
SESSION_SECRET=your-super-secret-key-here
```

### File Upload Configuration
Excel uploads are stored temporarily in the `uploads/` directory and processed immediately. Files are automatically cleaned up after processing.

## 🚨 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **Session Security**: Secure session management with MongoDB storage
- **Input Validation**: Comprehensive server-side validation
- **File Type Validation**: Only Excel files allowed for uploads
- **Size Limits**: 5MB maximum file size for uploads
- **User Isolation**: Each user can only access their own data
- **HTTPS Ready**: Configured for secure HTTPS deployment

## 📊 Tax Calculation Details

The application includes Canadian tax calculations based on 2025 tax brackets:

### Federal Tax Rates
- Up to $53,359: 15%
- $53,359 to $106,717: 20.5%
- Additional brackets for higher incomes

### Provincial Tax (Ontario)
- Base rate: 5.05%
- Progressive rates for higher incomes

### Deductions
- **CPP (Canada Pension Plan)**: 5.95% of pensionable earnings
- **EI (Employment Insurance)**: 1.88% of insurable earnings

*Note: Tax calculations are estimates for planning purposes. Consult a tax professional for precise calculations.*

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
SESSION_SECRET=your-strong-production-secret
PORT=3000
```

### Recommended Deployment Platforms
- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Modern deployment platform
- **DigitalOcean App Platform**: Scalable hosting
- **AWS/Azure/GCP**: Enterprise deployment options

### Production Considerations
1. **Database**: Use MongoDB Atlas or a managed MongoDB service
2. **File Storage**: Consider cloud storage for uploaded files
3. **Security**: Implement HTTPS and security headers
4. **Monitoring**: Add logging and error tracking
5. **Backup**: Regular database backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Projects
- `GET /projects` - List all projects
- `GET /projects/add` - Add project form
- `POST /projects/add` - Create new project
- `GET /projects/edit/:id` - Edit project form
- `POST /projects/edit/:id` - Update project
- `POST /projects/delete/:id` - Delete project

### Work Entries
- `GET /work/dashboard` - Work entries dashboard
- `GET /work/add` - Add work entry form
- `POST /work/add` - Create work entry
- `GET /work/edit/:id` - Edit work entry form
- `POST /work/edit/:id` - Update work entry
- `POST /work/delete/:id` - Delete work entry
- `GET /work/upload` - Excel upload form
- `POST /work/upload` - Process Excel upload
- `GET /work/download-template` - Download Excel template

### Reports
- `GET /reports` - Analytics dashboard
- `GET /reports/api/chart-data` - Chart data API

## 🔍 Troubleshooting

### Common Issues

#### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

#### File Upload Issues
- Ensure the `uploads/` directory exists and is writable
- Check file size limits (5MB maximum)
- Verify Excel file format (.xlsx or .xls)

#### Chart Display Issues
- Ensure Chart.js is loading properly
- Check browser console for JavaScript errors
- Verify data format in the charts

#### Session Issues
- Clear browser cookies and localStorage
- Restart the application
- Check MongoDB connection for session storage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Felipe Alfonso**
- Email: falfonso@student.georgianc.onca
- Program: Computer Programming - Georgian College
- Course: COMP2068 - JavaScript Frameworks

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- MongoDB team for the robust database solution
- Chart.js team for the beautiful charting library
- Bootstrap team for the responsive UI framework
- ExcelJS team for secure Excel file processing
- Georgian College COMP2068 course materials and instructors

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)
- [Handlebars Documentation](https://handlebarsjs.com/)

---


