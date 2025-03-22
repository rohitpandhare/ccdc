const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');

// Initialize the Express app
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

// Import middleware and routes
const { chkLogin } = require('./middleware/auth');
const authlinks = require('./routes/auth'); 
app.use('/auth', authlinks);

// Application Routes with correct paths
app.get('/', (req, res) => {
  res.render('layouts/index');
});

app.get('/login', (req, res) => {
  res.render('auth/login');
});

app.get('/signup', (req, res) => {
  res.render('auth/signup'); 
});

app.get('/pres', (req, res) => {
  res.render('dataRelated/pres');
});

app.get('/reset', (req, res) => {
  res.render('auth/reset_pass');
});

// Logout Route
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }
    res.status(200).json({ message: 'Successfully logged out' });
  });
});

// Role check middleware
const checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.session.loggedIn) {
      return res.redirect('/login');
    }
    
    if (!roles.includes(req.session.user.Role.toLowerCase())) {
      return res.status(403).render('checks/error', {
        message: 'Access Denied'
      });
    }
    
    next();
  };
};

// Protected routes with improved role checking
app.get('/admin', checkRole(['admin']), async (req, res) => {
  try {
    const [userList] = await conPool.promise().query(
      'SELECT Username, Email, Role, CreatedAt FROM user'
    );
    
    res.render('users/admin', { 
      user: req.session.user,
      userList: userList
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.render('users/admin', { 
      user: req.session.user,
      userList: []
    });
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


app.get('/patient', checkRole(['patient']), (req, res) => {
  res.render('users/patient', { user: req.session.user });
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
