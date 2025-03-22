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
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

app.use(express.static(path.join(__dirname, 'views'))); // Serve static files
app.set("view engine", "ejs"); // Use EJS for rendering views

// CORS configuration
var corsOptions = {
  credentials: true,
  origin: ['http://localhost:3001', 'http://localhost:3005'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Enable CORS for specified origins

// Middleware for session management
app.use(
  session({
    secret: 'rohitiscool', // Secret key for signing the session ID cookie
    resave: false, // Do not resave sessions if unmodified
    saveUninitialized: false, // Do not save uninitialized sessions
    cookie: {
      secure: false, // Set to `true` if using HTTPS
      maxAge: 1000 * 60 * 60 * 24 // 24 hour session expiry
    },
  })
);

// Middleware to check login status
const chkLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next(); // Proceed if logged in
  } else {
    req.session.ogPath = req.path; // Store original path for redirection
    res.redirect("/login"); // Redirect to login page
  }
};

// Importing routes
const authlinks = require('./routes/auth'); 
app.use('/auth', authlinks); // Mount authentication routes

// Application Routes
app.get('/', (req, res) => {
  res.render('index'); // Render the home page (index.ejs)
});

app.get('/login', (req, res) => {
  res.render('login'); // Render the login page (logged.ejs)
});

app.get('/signup', (req, res) => {
  res.render('signup'); 
});

app.get('/pres', (req, res) => {
  res.render('pres'); // Render the prescription page (pres.ejs)
});

app.get('/reset', (req, res) => {
  res.render('reset_pass'); // Render the password reset page (reset_pass.ejs)
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

// Dashboard route with authentication middleware
app.get('/dashboard', (req, res) => {
  if (req.session.loggedIn) {
      res.render('dashboard', { user: req.session.user });
  } else {
      res.redirect('/login');
  }
});

// Improved role check middleware
const checkRole = (roles = []) => {
  return (req, res, next) => {
      if (!req.session.loggedIn) {
          return res.redirect('/login');
      }
      
      if (!roles.includes(req.session.user.Role.toLowerCase())) {
          return res.status(403).render('error', {
              message: 'Access Denied'
          });
      }
      
      next();
  };
};

// Protected routes with improved role checking
// app.get('/admin', checkRole(['admin']), (req, res) => {
//   res.render('admin', { user: req.session.user });
// });

// In index.js - Update the admin route
app.get('/admin', checkRole(['admin']), async (req, res) => {
  try {
      // Fetch all users from database
      const [userList] = await conPool.promise().query(
          'SELECT Username, Email, Role, CreatedAt FROM user'
      );
      
      // Render admin page with both user session data and user list
      res.render('admin', { 
          user: req.session.user,  // Keeps the original admin login working
          userList: userList       // Adds the user list display
      });
  } catch (err) {
      console.error('Error fetching users:', err);
      // If database query fails, still render admin page with session data
      res.render('admin', { 
          user: req.session.user,  // Maintains admin login functionality
          userList: []             // Empty array if query fails
      });
  }
});

app.get('/doctor', checkRole(['doctor']), (req, res) => {
  res.render('doctor', { user: req.session.user });
});

app.get('/patient', checkRole(['patient']), (req, res) => {
  res.render('patient', { user: req.session.user });
});

// Detailed error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).send('Internal Server Error');
});


// Add basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
      success: false,
      error: 'Something went wrong!'
  });
});

// Starting the server
app.listen(port, () => {
  console.log(`The server is running on http://localhost:${port}`);
});

// // Enhanced database connection logging
// conPool.on('connection', (connection) => {
//   console.log('New MySQL Connection Established');
  
//   connection.on('error', (err) => {
//     console.error('MySQL Connection Error:', err);
//   });
// });