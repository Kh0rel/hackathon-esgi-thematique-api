var mysql   = require("mysql");
var jwt     = require('jsonwebtoken');

var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
// https://www.codementor.io/tips/9172397814/setup-file-uploading-in-an-express-js-application-using-multer-js
// https://ewiggin.gitbooks.io/expressjs-middleware/content/multer.html

function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}

function secret() {
  return 'THE_SECRET';
}

function getDate(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    if (dd<10) {
      dd='0'+dd
    }
    if (mm<10) {
      mm='0'+mm
    }
    return yyyy+'-'+mm+'-'+dd;
}

//MIDDLEWARE CHECK IF TOKEN EXIST AND IS VALID
function checkToken(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, 'SECRET_TOKEN', function(err, decoded) {
      if (err) {
        res.status(401).json({"Error" : true, "code": 401, "Message" : "Failed to authenticate token", "Decoded" : decoded});
      } else {
        //PASSING DATA WITH THE TOKEN (available throughout the request lifetime)
        res.locals._id = decoded["_id"];
        res.locals._email = decoded["_email"];
        next();
      }
    });
  } else {
      res.status(401).json({"Error" : true, "code": 401, "Message" : "No token provided"});
  }
}


REST_ROUTER.prototype.handleRoutes = function(router,connection,md5) {
    var self = this;

    // TEST ROUTE WHEN UP
    router.get("/",function(req,res){
      res.status(200).json({"Message" : "I am alive !"});
    });
}

module.exports = REST_ROUTER;
