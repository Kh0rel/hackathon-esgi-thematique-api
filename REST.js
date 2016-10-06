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
      // WARP FUNCTION (i)
      // CALL FUNCTION (i) in FOR
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
              console.log(rows);
              resolve(rows);
            }
          });
        });

        insertIntoUserBought.then((rows) => {
          console.log(rows);
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
                console.log('toto');
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


  // UPDATE info user
  // UPDATE table SET nom_colonne_1 = 'nouvelle valeur' WHERE condition
  router.put("/update-user", function(req,res,next) {
    // UPDATE user SET user_firstName = 'tata' WHERE user_id = 0;
    var query = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
    var table = ["user", req.body.toUpdate , req.body.value, "user_id" , req.body.idUser];
    query = mysql.format(query,table);
    console.log(query);
    connection.query(query,function(err,rows) {
       if (err) {
         if (!req.body.toUpdate || !req.body.value || !req.body.idUser) {
           res.status(409).json({"Error" : true, "code" : 409, "Message" : "Some field(s) are missing"});
         } else {
           res.status(500).json({"Error" : true, "code" : 500, "Message" : "Error executing MySQL query"});
         }
       } else {
           res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
       }
    });
  });


  //LIST FOLLOWERS
  router.get("/followers/:idUser", function(req,res,next) {
    //SELECT count(fr_id) FROM friend WHERE fr_follow = 1
    var query = "SELECT count(fr_id) as followers FROM ?? WHERE ?? = ?"
    var table = ["friend", "fr_follow", req.params.idUser];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if (err) {
            res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
        }
    });
  });

  //LIST FOLLOWING
  router.get("/following/:idUser", function(req,res,next) {
    //SELECT count(fr_id) FROM friend WHERE fr_follow = 1
    var query = "SELECT count(fr_id) as following FROM ?? WHERE ?? = ?"
    var table = ["friend", "fr_following", req.params.idUser];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if (err) {
            res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
        }
    });
  });

  //FOLLOW SOMEONE
  router.post("/follow/:idUser/:toFollow", function(req,res,next) {
    // INSERT INTO friend (fr_follow, fr_following, fr_date) VALUES (req.params.idUser, req.params.toFollow, currentDate)
    var currentDate = new Date().toLocaleString();
    var query = "INSERT INTO ?? (??, ??, ??) VALUES (?, ?, ?)"
    var table = ["friend", "fr_follow", "fr_following", "fr_date", req.params.idUser, req.params.toFollow, currentDate];
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


  //UNFOLLOW SOMEONE
  router.delete("/unfollow/:idUser/:toUnFollow", function(req,res,next) {
    try {
      //GET ID FOLLOW FOR SAFE MODE
      var getIDFollow = new Promise((resolve, reject) => {
        // SELECT fr_id FROM friend WHERE fr_follow = 1 AND fr_following = 4
        var query = "SELECT ?? FROM ?? WHERE ?? = ? AND ?? = ?"
        var table = ["fr_id", "friend", "fr_follow", req.params.idUser, "fr_following", req.params.toUnFollow];
        query = mysql.format(query,table);
        connection.query(query, function(err,rows){
          if (err) {
            console.log('error insert 1');
            reject(err);
            return;
          } else {
            resolve(rows);
          }
        });
      });

      getIDFollow.then((rows) => {
        // DELETE FROM `friend` WHERE fr_id = XX
        var query = "DELETE FROM ?? WHERE ?? = ?"
        var table = ["friend", "fr_id", rows[0].fr_id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if (err) {
                res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
            } else {
                res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
            }
        });
      });
    } catch(errr) {
      res.status(500).json({"Error" : true, "Message" : "Error" });
    }




  });

  //FIND USER
  router.get("/find/:user", function(req,res,next) {
    //SELECT count(fr_id) FROM friend WHERE fr_follow = 1
    var query = "SELECT * FROM ?? WHERE ?? = ?"
    var table = ["user", "user_surname", req.params.user];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if (err) {
            res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
          if (rows.length > 0) {
            res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
          } else {
            res.status(204).json({"Error" : false, "code" : 200, "Message" : "No user with this username"});
          }
        }
    });
  });


  //GET INFORMATIONS USER
  router.get("/user/:idUser", function(req,res,next) {
    // SELECT "user_avatar", "user_age", "user_firstName", "user_lastName", "user_mail", "user_points", "user_surname", "user_subDate" FROM user;
    var query = "SELECT ??, ??, ??, ??, ??, ??, ??, ?? FROM ?? WHERE ?? = ?"
    var table = ["user_avatar", "user_age", "user_firstName", "user_lastName", "user_mail", "user_points", "user_surname", "user_subDate", "user", "user_id", req.params.idUser];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if (err) {
            res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : rows});
        }
    });
  });

  // USER RATE EXERCICE
  router.post("/rate", function(req,res,next) {
    try {
      var addRate = new Promise((resolve, reject) => {

        var idExercice = req.body.idExercice;
        var idUser = req.body.idUser;
        var userRate = req.body.userRate;
        var currentDate = new Date().toLocaleString();

        var query = "INSERT INTO ?? (??, ??, ??, ??) VALUES (?, ?, ?, ?)"
        var table = ["rate", "rate_idExercice", "rate_idUser", "rate_value", "rate_date", req.body.idExercice, req.body.idUser, req.body.userRate, currentDate];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows) {
          if (err) {
            reject(err);
            return;
          } else {
            //add in rows
            rows.idExercice = idExercice;
            rows.idUser = idUser;
            rows.userRate = userRate;
            rows.currentDate = currentDate;
            console.log(rows);
            resolve(rows);
          }
        });
      });

      addRate.then((rows) => {
        var getNbVote = new Promise((resolve, reject) => {

          var idExercice2 = rows.idExercice;
          var idUser2 = rows.idUser;
          var userRate2 = rows.userRate;
          var currentDate2 = rows.currentDate;
          console.log('ex2 : ' + idExercice2);

          //SELECT count(rate_idExercice) as nbVote FROM rate WHERE rate_idExercice = 1;
          var query = "SELECT count(??) as ?? FROM ?? WHERE ?? = ?"
          var table = ["rate_idExercice", "nbVote", "rate", "rate_idExercice", rows.idExercice];
          query = mysql.format(query,table);
          console.log(query);
          //prepare to add in rows and insert data

          connection.query(query, function(err,rows){
            if (err) {
              reject(err);
              return;
            } else {
              //add in rows
              rows.idExercice = idExercice2;
              rows.idUser = idUser2;
              rows.userRate = userRate2;
              rows.currentDate = currentDate2;
              console.log(rows);
              resolve(rows);
            }
          });
        });

        getNbVote.then((rows) => {
          //UPDATE RATE IN EXERCICE TABLE
          console.log('final rows');
          console.log(rows);
          console.log(rows[0].nbVote);
          // INSERT INTO exercice (exer_rate) VALUES ();
           //UPDATE utilisateur SET nombreJetonUtilisateur = nombreJetonUtilisateur-10 WHERE idUtilisateur=2
          var query = "UPDATE ?? SET ?? = (((??*?)+?)/(?+1)) WHERE ?? = ?"
          var table = ["exercice", "exer_rate", "exer_rate", rows[0].nbVote, rows.userRate, rows[0].nbVote, "exer_id", rows.idExercice];
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
      });


    } catch (errr) {
          res.status(500).json({"Error" : true, "Message" : "Error" });
        }
  });

  // GET EXERCICES FOR FRONT
  router.get("/exercices", function(req,res,next) {
    // SELECT * FROM exercice
    // INNER JOIN location ON exercice.exer_idLocation = location.loc_id
    // INNER JOIN position ON exercice.exer_idPosition = position.pos_id
    var query = "SELECT * FROM ?? INNER JOIN ?? ON ??.?? = ??.?? INNER JOIN ?? ON ??.?? = ??.??"
    var table = ["exercice", "location", "exercice", "exer_idLocation", "location", "loc_id", "position", "exercice", "exer_idPosition", "position", "pos_id"];
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

  router.get("/exercices", function(req,res,next) {
    // SELECT * FROM exercice
    // INNER JOIN location ON exercice.exer_idLocation = location.loc_id
    // INNER JOIN position ON exercice.exer_idPosition = position.pos_id
    var query = "SELECT * FROM ?? INNER JOIN ?? ON ??.?? = ??.?? INNER JOIN ?? ON ??.?? = ??.??"
    var table = ["exercice", "location", "exercice", "exer_idLocation", "location", "loc_id", "position", "exercice", "exer_idPosition", "position", "pos_id"];
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

  router.get("/exercice-detail/:idUser/:exName", function(req,res,next) {
    // SELECT * FROM exercice
    // INNER JOIN accomplished ON exercice.exer_id = accomplished.a_idExercice
    // WHERE a_idUser = 1 AND exer_name = 'ex1'
    var query = "SELECT * FROM ?? INNER JOIN  ON ??.?? = ??.?? WHERE ?? = ? AND ?? = TRIM(?)"
    console.log(typeof req.body.exName);
    var table = ["exercice", "accomplished", "exercice", "exer_id", "accomplished", "a_idExercice", "a_idUser", req.body.idUser, "exer_name", req.body.exName];
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




  router.get("/user-detail/:nameUser/:idUser", function(req,res,next) {

    try {
      var getInfoUser = new Promise((resolve, reject) => {
        // SELECT * FROM user WHERE user_surname='tt'
        var query = "SELECT * FROM ?? WHERE ?? = ?";
        var table = ["user", "user_surname", req.params.nameUser];
        query = mysql.format(query,table);
        console.log(query);
        connection.query(query,function(err,rows){
          if (err) {
            reject(err);
            return;
          } else {
            console.log(rows[0]);
            // var infoUser = rows[0];
            // rows.infoUser = infoUser;
            resolve(rows);
          }
        });
      });

      getInfoUser.then((rows) => {
        var getFollows = new Promise((resolve, reject) => {
          console.log('next');
          console.log('idUser : ' + req.params.idUser);
          console.log(rows);

          var user_id = rows[0].user_id;
          var user_avatar = rows[0].user_avatar;
          var user_surname = rows[0].user_surname;
          // GET FOLLOWERS AND FOLLOWING
            // CHECK IF FOLLOW
            // SELECT count(fr_id) FROM friend WHERE fr_follow=1 UNION SELECT count(fr_id) FROM friend WHERE fr_following=2
          var query = "SELECT count(??) as result FROM ?? WHERE ??=? UNION ALL SELECT count(??) FROM ?? WHERE ??=? UNION ALL SELECT count(??) FROM ?? WHERE ??=? AND ??=? UNION ALL SELECT count(??) FROM ?? WHERE ??=? AND ??=?";
          var table = ["fr_id", "friend", "fr_follow", req.params.idUser, "fr_id", "friend", "fr_following", rows[0].user_id, "fr_id", "friend", "fr_follow", req.params.idUser,
          "fr_following", rows[0].user_id, "fr_id", "friend", "fr_follow", rows[0].user_id, "fr_following", req.params.idUser];
          query = mysql.format(query,table);
          connection.query(query,function(err,rows){
            if(err) {
              res.status(400).json({"Error" : true, "code": 400 ,"Message" : "Fields already in the table utilisateur_has_paris" });
              reject(err);
              return;
            } else {
              console.log('next');
              rows.user_id = user_id;
              rows.user_avatar = user_avatar;
              rows.user_surname = user_surname;
              console.log(rows[0].result);
              rows.followers = rows[0].result;
              rows.following = rows[1].result;
              (rows[2].result == 1) ? rows.isFollow = true : rows.isFollow = false;
              (rows[2].result == 1 && rows[3].result == 1) ? rows.reciproque = true : rows.reciproque = false;
              console.log(rows);
              var toto = rows;
              // resolve(rows);
              res.status(200).json({"Error" : false, "code" : 200, "Message" : "Success",
                "Result" : {
                  user_id,
                  user_avatar,
                  user_surname,
                  "followers": rows[0].result,
                  "following": rows[1].result,
                  "isFollow": rows.isFollow,
                  "reciproque": rows.reciproque
                }
              });
            }
          });
        });
        /*
        getFollows.then((rows) => {
          console.log('toto');
          console.log(rows);
          var toto = rows;
          console.log(toto);
          if (!rows) {
            return res.status(500).json({"Error" : true, "Message" : "Error executing MySQL query"});
          } else {
            console.log('blbl');
            return res.status(201).json({"Error" : false, "code" : 200, "Message" : "Success", "Result" : toto});
          }
        });
        */
      });
    } catch (errr) {
      res.status(500).json({"Error" : true, "Message" : "Error" });
    }
  });


}

module.exports = REST_ROUTER;
