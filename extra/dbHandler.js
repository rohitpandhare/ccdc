var myDB = require('mysql');
var data = {};
var md5 = require('md5');

var conPool = myDB.createPool(
    {
        connectionLimit:100, // connection limit to save cpu resources
        host:"localhost",
        user:"pma",
        password:"JhingalalaHuHu",
        database:"to-do-app",
        debug:false
    }
);

//function to filter headers data from db read query
function grabHeaders(headerData){
        return headerData.map(h=>h.name);
}

//function to return a json structure to be sent to the frontEnd
function senResponse(res,message="ok",data={}, error=false,status=200){
    res.set('Access-Control-Allow-Credentials',true);
    try {
        
        res.status(status)
        res.json(
            {
                message:message,
                data:data
            }
        );
    } catch (error) {
        res.json({message:error})
    }
}

/* get User Types */
function getUserTypes(req,res){
    conPool.query("select id,type,description from user_types",
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
/* userCreate */
function createUser(req,res){
    conPool.query(
        `insert into users
             (username,fname,lname,email,type,passkey) 
                values (
                    '${req.body.user}',
                    '${req.body.fname}',
                    '${req.body.lname}',
                    '${req.body.email}',
                    1,
                    '${md5(req.body.password)}'
                    )`,
        (err,data)=>{
            if(err){
                //send error response
                senResponse(
                    res,
                    "Invalid Input",
                    {},
                    true,
                    403,
                );
            }
            //send result
            else{
                senResponse(
                    res,
                    "User Added!",
                    {
                        data:data.insertId
                    },
                    false,
                    201
                );
            }
        }
    );
}
/* login function */
function doLogin(req,res){
    conPool.query(
        `select id,username,fname,lname,email,active from users where username='${req.body.user}' and passkey='${md5(req.body.password)}'`,
        (qErr,result,fields)=>{
            if(qErr) {
                console.log(qErr);
                senResponse(
                    res,
                    message,
                    data,
                    true,
                    403,
                );
            }
            else{
                if(result.length!=0){
                    
                    switch (result[0].active){

                        case 0:
                            senResponse(
                                res,
                                "User disabled, please contact admin",
                                {},
                                true,
                                403,
                            );
                            break;
                        case 1:
                            req.session.loggedIn=true;
                            loggedIn:req.session.loggedIn,
                            req.session.user = {
                                fname:result[0].fname,
                                lname:result[0].lname,
                                email:result[0].email,
                                uid:result[0].id,

                            }
                            senResponse(
                                res,
                                "Login Success!",
                                {
                                    loggedIn:req.session.loggedIn,
                                    user:req.session.user,
                                },
                                true,
                                200,
                            );
                            break;
                        default:
                            senResponse(
                                res,
                                "Unknown Error",
                                {},
                                true,
                                406,
                            );
                            break;
                    }                    
                }
                else{
                    
                    senResponse(
                        res,
                        "Your username or password is wrong! please try again",
                        {},
                        true,
                        401,
                    );
                }
                
            }
        }
    )
}

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

module.exports= {getUserTypes,createUser,doLogin,dbRead,dbCud}