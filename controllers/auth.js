//Helper func 1
function grabHeaders(headerdata) { //grabbing parameter from header
    return headerdata.map(h => h.name); // Headerdata is array , where we use map  ( h) with h.name - return all names  in headerdata
}

//Helper func 2
function sendResponse(res, message = "Good-Going", data = {}, error = false, status = 200) {  //200 - http status code
    res.set('Access-Control-Allow-Credentials', true); // for coRs - allow credentials to include in cors req
    try {
        res.status(status); 
        res.json({
            message: message,
            data: data
        });
    } catch (error) {
        res.json({
            message: error.message,
            data: data
        });
    }
}

// BY default, all users are guests until they log in
const checkAuth = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
        next(); // if logged in, move to next 
    } else {
        // Set as guest user
        req.session.role = 'GUEST';
        next(); // normal home page activities
    }
};

// guest settings
const isGuest = (req) => {
    return !req.session.loggedIn; // return false if logged in
};


module.exports = {
    grabHeaders,
    sendResponse,
    checkAuth,
    isGuest
};
