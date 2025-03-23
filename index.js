const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');

const path = require('path');
const cors = require('cors');

// Initializing the Express app
const app = express();
const port = 3000;

// Database connection pool
const conPool = mysql.createPool({
  connectionLimit: 100,
  host: "localhost",
  user: 'root',
  password: 'root',
  database: "doctorsync_db",
  debug: false
});

// Middleware to handle request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set views and static files
app.use(express.static(path.join(__dirname, 'views')));
app.set("view engine", "ejs");

// CORS configuration
var corsOptions = {
  credentials: true,
  origin: ['http://localhost:3001', 'http://localhost:3005'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Session middleware
app.use(
  session({
    secret: 'rohitiscool',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    },
  })
);

// Middleware to check if user is logged in
import { checkRole } from require('./middleware/auth');
app.use(checkRole);

// Import middleware and routes
const authlinks = require('./routes/auth'); 
app.use('/auth', authlinks);

// Home page route
app.get('/', (req, res) => {
  res.render('layouts/index');
});

// login and signup routes
app.get('/login', (req, res) => {
  res.render('auth/login');
});

app.get('/signup', (req, res) => {
  res.render('auth/signup'); 
});

// Logout Route
app.get('/logout', (req, res) => {
  res.render('auth/logout');
});

//reset password 
app.get('/reset', (req, res) => {
  res.render('auth/reset_pass');
});



//Home page routes
// Prescription route
app.get('/pres', (req, res) => {
  res.render('dataRelated/pres');
});

// POST route to handle prescription lookup
app.post('/pres', async (req, res) => {
  try {
    const refId = req.body.refId;
    
    // Query to get prescription details
    const [prescriptions] = await conPool.promise().query(`
      SELECT 
      p.PrescriptionID,
              p.DateIssued,
              p.DiagnosisNotes,
              p.Medicines,
              p.Status,
              p.GlobalReferenceID,
              d.Name as DoctorName
              FROM PRESCRIPTION p
              JOIN DOCTOR d ON p.DoctorID = d.DoctorID
              WHERE p.GlobalReferenceID = ?
              `, [refId]);
              
              if (prescriptions.length === 0) {
          return res.render('dataRelated/pres', { 
              error: 'No prescription found with this reference ID' 
            });
          }
          
      res.render('dataRelated/pres', { prescription: prescriptions[0] });
      
    } catch (err) {
      console.error('Error fetching prescription:', err);
      res.render('dataRelated/pres', { 
        error: 'Error retrieving prescription details' 
      });
    }
  });

  // GET route for doctors listing
app.get('/doctors', async (req, res) => {
  try {
    // Query to get all doctors with their details
    const [doctors] = await conPool.promise().query(`
      SELECT 
      DoctorID,
              Name,
              Specialty,
              Phone,
              LicenseNumber,
              Qualifications
          FROM DOCTOR
          ORDER BY Name
      `);
      
      res.render('dataRelated/doctors', { doctors });
    } catch (err) {
      console.error('Error fetching doctors:', err);
      res.render('dataRelated/doctors', { 
        doctors: [],
        error: 'Error retrieving doctors list'
      });
    }
  });
  
// Add search functionality
app.get('/doctors/search', async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
      const [doctors] = await conPool.promise().query(`
          SELECT 
              DoctorID,
              Name,
              Specialty,
              Phone,
              LicenseNumber,
              Qualifications
              FROM DOCTOR 
              WHERE 
              Name LIKE ? 
              OR Specialty LIKE ?
      `, [`%${searchTerm}%`, `%${searchTerm}%`]);
      
      res.render('dataRelated/doctors', { doctors });
  } catch (err) {
    console.error('Error searching doctors:', err);
    res.render('dataRelated/doctors', { 
      doctors: [],
      error: 'Error searching doctors'
    });
  }
});

// Protected routes
app.get('/patient', checkRole(['patient']), (req, res) => {
  res.render('users/patient', { user: req.session.user });
});
// Protected routes with improved role checking
app.get('/admin', checkRole(['admin']), async (req, res) => {
  try {
      // Get the admin user details
      const [adminDetails] = await conPool.promise().query(
          'SELECT Username FROM user WHERE UserID = ?',
          [req.session.user.UserID]
      );

      // Fetch all required data in parallel
      const [userList, doctorList, patientList] = await Promise.all([
          conPool.promise().query('SELECT UserID, Username, Email, Role, CreatedAt FROM user'),
          conPool.promise().query('SELECT DoctorID, Name, Specialty, Phone, LicenseNumber, Qualifications FROM doctor'),
          conPool.promise().query('SELECT PatientID, Name, Address, Phone, DOB, BloodGroup FROM patient')
      ]);
      
      res.render('users/admin', { 
          user: adminDetails[0] || { Username: 'Admin' },  // Provide a default
          userList: userList[0],
          doctorList: doctorList[0],
          patientList: patientList[0]
      });
  } catch (err) {
      console.error('Error fetching data:', err);
      res.render('users/admin', { 
          user: { Username: 'Admin' },  // Provide a default
          userList: [],
          doctorList: [],
          patientList: []
      });
  }
});

// Add delete routes
app.post('/admin/delete-user/:id', checkRole(['admin']), async (req, res) => {
  try {
      await conPool.promise().query('DELETE FROM user WHERE UserID = ?', [req.params.id]);
      res.json({ success: true });
  } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ success: false });
  }
});

app.post('/admin/delete-doctor/:id', checkRole(['admin']), async (req, res) => {
  try {
      await conPool.promise().query('DELETE FROM doctor WHERE DoctorID = ?', [req.params.id]);
      res.json({ success: true });
  } catch (err) {
      console.error('Error deleting doctor:', err);
      res.status(500).json({ success: false });
  }
});

app.post('/admin/delete-patient/:id', checkRole(['admin']), async (req, res) => {
  try {
      await conPool.promise().query('DELETE FROM patient WHERE PatientID = ?', [req.params.id]);
      res.json({ success: true });
  } catch (err) {
      console.error('Error deleting patient:', err);
      res.status(500).json({ success: false });
  }
});

// In index.js
app.get('/doctor', checkRole(['doctor']), async (req, res) => {
  try {
      // Default stats object
      const stats = {
          totalPatients: 0,
          upcomingAppointments: 0,
          recentAppointments: []
      };

      // Only query if user is logged in and is a doctor
      if (req.session.user && req.session.user.Role === 'doctor') {
          // Get total patients count
          const [patientCount] = await conPool.promise().query(
              'SELECT COUNT(*) as count FROM user WHERE Role = "patient"'
          );

          // Get upcoming appointments
          const [appointmentCount] = await conPool.promise().query(
              'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND appointment_date > NOW()',
              [req.session.user.UserID]
          );

          // Update stats with actual data
          stats.totalPatients = patientCount[0].count;
          stats.upcomingAppointments = appointmentCount[0].count;
      }

      res.render('users/doctor', {
          user: req.session.user,
          stats: stats
      });
  } catch (err) {
      console.error('Error loading doctor dashboard:', err);
      res.render('users/doctor', {
          user: req.session.user,
          stats: {
              totalPatients: 0,
              upcomingAppointments: 0,
              recentAppointments: []
          }
      });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.render('checks/error', {
    message: 'Internal Server Error'
  });
});

// Starting the server
app.listen(port, () => {
  console.log(`The server is running on http://localhost:${port}`);
});
