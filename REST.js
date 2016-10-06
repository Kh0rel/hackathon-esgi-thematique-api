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
    jwt.verify(token, secret(), function(err, decoded) {
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


    /* TRY ZONE */
    router.get("/test", function(req,res,next) {
      //SELECT idParis, coteEquipe1, coteEquipe2, equipe1Paris, equipe2Paris FROM paris;
      var query = "SELECT * FROM ??"
      var table = ["user"];
      query = mysql.format(query,table);
      connection.query(query,function(err,rows){
          if (err) {
              res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
          } else {
              res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
          }
      });
    });
    /* END TRY ZONE */








    router.post("/authenticate", function(req,res) {
    // SELECT count(*) as auth FROM user WHERE user_mail = 'toto@toto.com' AND user_pwd = 'toto'
    //        UNION SELECT user_id FROM user WHERE user_mail = 'toto@toto.com' AND user_pwd = 'toto'
    // return 2 rows : count AND idUtilisateur
    var query = "SELECT count(*) as auth FROM ?? WHERE ?? = ? AND ?? = ? UNION SELECT ?? FROM ?? WHERE ?? = ? AND ?? = ?";
    var table = ["user", "user_mail", req.body.email, "user_pwd", req.body.pwd, "user_id", "user", "user_mail", req.body.email, "user_pwd", req.body.pwd];
    query = mysql.format(query,table);
    console.log(query);
    connection.query(query,function(err,rows){
      if (err) {
          res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
      } else {
        if(rows[0]['auth'] == 1){
          _idUser = rows[1]['auth'];
          var token = jwt.sign({ _id: _idUser, _email: req.body.email}, secret(), {
            expiresIn: 10080 // (1440 (1 day)) expires in 7 days
          });
          res.status(200).json({ "Error": false, "code" : 200, "Message" : 'Welcome !', "token" : token, "Result" : rows});
        } else {
          res.status(403).json({"Error" : true, "code" : 403, "Message" : "Authentication failed, wrong username or password" });
        }
      }
    });
  });

  router.post("/subscribe", function(req, res) {
    if (!req.body.email || !req.body.pwd || !req.body.firstName || !req.body.lastName || !req.body.age || !req.body.surname) {
      res.status(400).json({"Error" : true, "code": 400 ,"Message" : "email or pwd required" });
    }
    try {
          var CheckIfAlreadyRegister = new Promise((resolve, reject) => {
            // SELECT * FROM `esgi-hackathon`.user WHERE user_mail = 'toto@toto.com'
            var query = "SELECT * FROM ?? WHERE ?? = ?"
            var table = ["user", "user_mail", req.body.email];
            query = mysql.format(query,table);
            console.log(query);
            connection.query(query,function(err,rows){
              if (err) {
                console.log('toto');
                reject(err);
                return;
              } else {
                console.log('to');
                console.log(rows[0]);
                if (rows[0] !== undefined) {
                  console.log('already in');
                  res.status(400).json({"Error" : true, "code": 400 ,"Message" : "exist" });
                  reject(err);
                  return;
                } else {
                  console.log('ok');
                  resolve(rows);
                }
              }
            });
          });

          CheckIfAlreadyRegister.then((rows) => {
            var currentDate = new Date().toLocaleString();
            console.log(currentDate);
            if (!req.body.avatar) {
              req.body.avatar = '';
            }
              // INSERT INTO table (user_firstName, user_lastName, user_pwd, user_avatar, user_age, user_mail) VALUES ('to', 'c', 't')
              // user_firstName, user_lastName, user_pwd, user_avatar, user_age, user_mail
              var query = "INSERT INTO ?? (??, ??, ??, ??, ??, ??, ??, ??, ??) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
              var table = ["user", "user_firstName", "user_lastName", "user_subDate", "user_pwd", "user_avatar", "user_age", "user_mail", "user_surname", "user_isPremium", req.body.firstName, req.body.lastName, currentDate, req.body.pwd, req.body.avatar, req.body.age, req.body.email, req.body.surname, 0];
              query = mysql.format(query,table);
              console.log(query);

              connection.query(query,function(err,rows){
                  if (err) {
                      res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
                  } else {
                      res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
                  }
              });
          });
    } catch (errr) {
      res.status(500).json({"Error" : true, "Message" : "Error" });
    }
  });





  /* ITEMS AND BUY */

  //GET ALL ITEMS
  router.get("/items", function(req,res,next) {
    //SELECT idParis, coteEquipe1, coteEquipe2, equipe1Paris, equipe2Paris FROM paris;
    var query = "SELECT * FROM ??"
    var table = ["item"];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if (err) {
            res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
        }
    });
  });

  //GET ITEMS BOUGHT BY A USER
  router.get("/item-history/:idUser", function(req,res,next) {
    // SELECT * FROM userBought INNER JOIN item WHERE userBought.userBought_item = item.item_id AND userBought_user = 0;
    // req.params.idUser
    var query = "SELECT * FROM ?? INNER JOIN ?? WHERE ??.?? = ??.?? AND ?? = ?;"
    var table = ["userBought", "item", "userBought", "userBought_item", "item", "item_id", "userBought_user", req.params.idUser ];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if (err) {
            res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
        }
    });
  });

  router.post("/buy-items", function(req, res, next) {
    console.log(req.body.length);
    if(req.body.length > 0) {
      for (var i = 0; i < req.body.length; i++) {
        try {
        var insertIntoUserBought = new Promise((resolve, reject) => {
          //INSERT INTO userBought (userBought_item, userBought_user, userBought_quantity) VALUES ('v1', 'v2', 'v3')
          var query = "INSERT INTO ?? (??, ??, ??) VALUES (?, ?, ?)"
          var table = ["userBought", "userBought_item", "userBought_user", "userBought_quantity", req.body[i].idItem, req.body[i].idUser, req.body[i].quantity];
          query = mysql.format(query,table);
          console.log(query);
          //prepare to add in rows
          var idItem = req.body[i].idItem;
          var idUser = req.body[i].idUser;
          var quantity = req.body[i].quantity;
          connection.query(query, function(err,rows){
            if (err) {
              console.log('error insert 1');
              reject(err);
              return;
            } else {
              //add in rows
              rows.idItem = idItem;
              rows.idUser = idUser;
              rows.quantity = quantity;
              resolve(rows);
            }
          });
        });

        insertIntoUserBought.then((rows) => {
          // UPDATE ITEMS QUANTITY
          // UPDATE table SET nom_colonne_1 = 'nouvelle valeur' WHERE condition
          var query = "UPDATE ?? SET ?? = ?? - ? WHERE ?? = ?"
          var table = ["item", "item_quantity", "item_quantity", rows.quantity, "item_id", rows.idItem];
          query = mysql.format(query,table);
          console.log(query);
          connection.query(query,function(err,rows){
              if (err) {
                  res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
              } else {
                  res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
              }
          });

        });
      } catch (errr) {
        res.status(500).json({"Error" : true, "Message" : "Error" });
      }

      }
    } else {
      res.status(404).json({"Error" : true, "Message" : "nothing to insert"});
    }
  });
}

module.exports = REST_ROUTER;
