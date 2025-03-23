const { conPool } = require('../config/db'); // importing conpool for DB operations

async function getAdminDashboard (req, res) {
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
};


// Add delete routes
async function deleteUser (req, res){
  try {
      await conPool.promise().query('DELETE FROM user WHERE UserID = ?', [req.params.id]);
      res.json({ success: true });
  } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ success: false });
  }
};

async function deleteDoctor(req, res){
  try {
      await conPool.promise().query('DELETE FROM doctor WHERE DoctorID = ?', [req.params.id]);
      res.json({ success: true });
  } catch (err) {
      console.error('Error deleting doctor:', err);
      res.status(500).json({ success: false });
  }
};

async function deletePatient (req, res){
  try {
      await conPool.promise().query('DELETE FROM patient WHERE PatientID = ?', [req.params.id]);
      res.json({ success: true });
  } catch (err) {
      console.error('Error deleting patient:', err);
      res.status(500).json({ success: false });
  }
};

// exporting the functions to be used in other files
module.exports = {
  getAdminDashboard,
  deleteUser,
  deleteDoctor,
  deletePatient
};