var myDB = require('mysql2');
var md5 = require('md5');
var data = {};

const conPool = myDB.createPool({
    connectionLimit: 1000,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: "ccdc",
    debug: false,
    waitForConnections: true,
    queueLimit: 0
});

function grabHeaders(headerdata){
    return headerdata,map(h => h.name);
}

function sendResponse(res, message = "ok", data ={},error = false,status = 200){
    res.set('Access-Control-Allow-Credentials', true);
    try{
        res.status(status)
        res.json(
          {
            message: message,
            data: data
          }
      );
    } catch (error){
        res.json({
            message: error.message,
            data: data
        });
    };
}

//  NEED To be used
function getUserTypes(req, res) {
  conPool.query("SELECT id, type, description FROM user_types", (err, data, headerData) => {
    if (err) {
      console.error(err);
      sendResponse(res, "SQL Error", { message: err.message }, true, 500);
      return;
    }
    sendResponse(res, "ok", {
      heads: grabHeaders(headerData),
      data: data
    });
  });
}

// Updated createUser function
function createUser(req, res) {
    const { username, fname, lname, email, password, user_type } = req.body;
  
    // Validate input with more robust checks
    if (!username || !fname || !lname || !email || !password) {
      return res.status(400).render('signup', { 
        error: "Missing required fields" 
      });
    }
  
    // Validate user type
    const validUserTypes = ['patient', 'doctor', 'admin'];
    const normalizedUserType = user_type.toLowerCase();
    
    if (!validUserTypes.includes(normalizedUserType)) {
      return res.status(400).render('signup', { 
        error: `Invalid user type. Must be one of: ${validUserTypes.join(', ')}` 
      });
    }
  
    const hashedPassword = md5(password);
    const query = `
      INSERT INTO users 
      (username, fname, lname, email, passkey, active, user_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      username, 
      fname, 
      lname, 
      email, 
      hashedPassword, 
      1, 
      normalizedUserType // Use normalized user type
    ];
  
    conPool.query(query, values, (err, result) => {
      if (err) {
        console.error('User Creation Error:', err);
        
        // Handle unique constraint violations
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).render('signup', { 
            error: "Username or email already exists" 
          });
        }
  
        return res.status(500).render('signup', { 
          error: "Error creating user: " + err.message 
        });
      }
  
      console.log('User Created Successfully:', {
        username: username,
        userType: normalizedUserType
      });
  
      res.redirect('/login');
    });
  }
  

// Updated doLogin function
function doLogin(req, res, callback) {
  const { username, password,user_type } = req.body;
  const hashedPassword = md5(password);
  
  const query = 'SELECT id, fname, lname, email FROM users WHERE username = ? AND passkey = ? AND active = 1 AND user_type = ?';

  conPool.query(query, [username, hashedPassword, user_type], (err, results) => {
      if (err) {
          console.error(err);
          return callback(err, null);
      }

      if (results.length > 0) {
          const user = results[0];

           // Log successful login details
           console.log('Successful Login:', {
            username: user.fname,
            userType: user.user_type
        });

          callback(null, { 
              success: true, 
              user: {
                    id: user.id,
                    fname: user.fname,
                    lname: user.lname,
                    email: user.email,
                    user_type: user.user_type
                } 
          });
      } else {
        console.warn('Login Failed:', {
            username: username,
            attemptedUserType: userType
        });

          callback(null, { 
              success: false,
              message: 'Invalid credentials' 
          });
      }
  });
}

// Additional user management functions
function getUserProfile(req, res) {
  const userId = req.params.id;
  
  const query = 'SELECT id, username, fname, lname, email FROM users WHERE id = ?';
  
  conPool.query(query, [userId], (err, results) => {
      if (err) {
          console.error(err);
          return sendResponse(res, "Error fetching user profile", { message: err.message }, true, 500);
      }
      
      if (results.length > 0) {
          sendResponse(res, "User profile retrieved", { user: results[0] });
      } else {
          sendResponse(res, "User not found", {}, true, 404);
      }
  });
}

function updateUserProfile(req, res) {
  const { id, fname, lname, email } = req.body;
  
  const query = 'UPDATE users SET fname = ?, lname = ?, email = ? WHERE id = ?';
  
  conPool.query(query, [fname, lname, email, id], (err, result) => {
      if (err) {
          console.error(err);
          return sendResponse(res, "Error updating profile", { message: err.message }, true, 500);
      }
      
      if (result.affectedRows > 0) {
          sendResponse(res, "Profile updated successfully");
      } else {
          sendResponse(res, "User not found", {}, true, 404);
      }
  });
}


conPool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('MySQL Database Connected Successfully');
    connection.release();
});

module.exports = {
    doLogin,
    grabHeaders,
    sendResponse,
    getUserTypes,
    createUser,
    getUserProfile,
    updateUserProfile,
    conPool
};



// FUnctions can be added

/* Generic DB Read function */
function dbRead(res,table,columns="*",condition=null,limit=0,order='ASC',orderBy=null){
    let query = `select ${columns} from ${table} ${condition==null? '': condition} ${orderBy==null? '':'order by '+orderBy+' '+order} ${limit>0? 'limit '+limit : ''}`
    conPool.query(query,
        (err,data,headerData)=>{
            if(err){
                senResponse(
                    res,
                    "SQL Error",
                    {message:err.message},
                    true,
                    500,
                );
            }
            else{
                senResponse(
                    res,
                    "ok",
                    {
                        heads:grabHeaders(headerData),
                        data:data
                    }
                );
            }
        }
    );
}

/* Generic DB CUD function*/
function dbCud(res,cudOp,table,colValmap,condition=null,successMessage,errorMessage){
    let query ;
    let opr;
    switch (cudOp.toLowerCase()){
        case 'update':
            opr=[];
            colValmap.forEach (function(value, key) {
                opr.push(key + ' = \'' + value+'\'');
              });
            query = `update ${table} set ${opr.join()} ${condition==null? '': condition}`;
            break;
        case 'insert':
            query = `insert into ${table} (${Array.from(colValmap.keys()).join()}) values ('${Array.from(colValmap.values()).join("', '")}') ${condition==null? '': condition}`;
                break;
        case 'delete':
            query = `delete FROM ${table} ${condition==null? '': condition}`;
                break;
        default:
            break;

    }
    console.log(query)
    conPool.query(
                    query
                    ,
                    (err,data)=>{
                        if(err){
                            //send error response
                            senResponse(
                                res,
                                errorMessage,
                                err.message,
                                true,
                                403,
                            );
                        }
                        //send result
                        else{
                            senResponse(
                                res,
                                successMessage,
                                {
                                    data:data
                                },
                                false,
                                201
                            );
                        }
        }
    );
}

function dbClose(){
    conPool.end((err) => {
        if (err) {
          console.error('Error closing the connection pool:', err);
          return;
        }
        console.log('Connection pool closed.');
      });
}

