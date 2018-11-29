var express = require('express');
var MongoClient = require("mongodb").MongoClient;
var router = express.Router();
var async = require("async");
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://127.0.0.1:27017";


/* *********页码设置************ ********/
// location:3000/users
router.get("/", function (req, res, next) {
  //显示第几页
  var page = parseInt(req.query.page) || 1;
  //每一页的显示几条注册信息；
  var pageSize = parseInt(req.query.pageSize) || 5;
  //注册信息总条数；
  var totalSize = 0;
  var data = [];
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      res.render("error", {
        message: "链接失败",
        error: err
      })
      return;
    }
    var db = client.db("project");
    async.series([
      function (cb) {
        // db.collection("user").find().count(function (err, num) {
        db.collection('user').find().count(function (err, num) {
          if (err) {
            cb(err);
          } else {
            totalSize = num;
            cb(null);
          }
        })
      },
      function (cb) {
        //每一页分布的数据，总共能分多少页
        db.collection("user").find().limit(pageSize).skip(page * pageSize - pageSize).toArray(function (err, data) {
          if (err) {
            cb(err);
          } else {

            cb(null, data);
          }
        })

      }
    ], function (err, results) {
      if (err) {
        res.render("error", {
          message: "错误",
          error: err
        })
      } else {
        var totalPage = Math.ceil(totalSize / pageSize);
        res.render("users", {
          list: results[1],
          pageSize: pageSize,
          totalPage: totalPage,
          currentPage: page
        })
      }
    })
  })
})


/* *********链接服务器并渲染数据************ */
// location:3000/users
// router.get('/', function (req, res, next) {
//   // 链接服务器
//   MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
//     // 链接信息反馈
//     if (err) {
//       res.render("error", {
//         message: "链接数据库失败",
//         error: err
//       });
//       return;
//     }
//     var db = client.db("project");
//     // 查询数据库
//     db.collection("user").find().toArray(function (err, data) {
//       if (err) {
//         res.render("error", {
//           message: "查询失败",
//           error: err
//         })
//       } else {
//         res.render("users", {
//           list: data
//         });
//       }
//       //关闭数据库的链接
//       client.close();
//     })
//   });

// });


/* ******用户参数有效性验证及登陆验证********** */
//localhost:3000/users/login
router.post('/login', function (req, res) {
  var username = req.body.name;
  var password = req.body.pwd;
  if (!username) {
    res.render("error", {
      message: "用户名不能为空",
      error: new Error("用户名布恩那个为空")
    })
    return;
  }
  if (!password) {
    res.render("error", {
      message: "密码不能为空",
      error: new Error("密码不能为空")

    })
    return;
  }
  /* ******链接数据库验证用户登录********** */
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      res.render("error", {
        message: "链接失败",
        error: err
      })
      return;
    }
    var db = client.db("project");
    db.collection("user").find({
      username: username,
      password: password
    }).toArray(function (err, data) {
      if (err) {
        res, render("error", {
          message: "查询失败",
          error: err

        })
      } else if (data.length <= 0) {
        res.render("error", {
          message: "登录失败",
          error: new Error("登录失败")
        })
      } else {
        // 登录成功
        //建立一个cookie存储信息；
        res.cookie('nickname', data[0].nickname, {
          maxAge: 60 * 60 * 1000
        });
        //这个登陆成功后要跳转到某一页面，不能用send，send()会提前执行
        res.redirect("/")
      }
      client.close();
    })

  })

})

/***** 用户注册********* *******************/
// localhost: 3000 / user / register
router.post('/register', function (req, res) {

  var name = req.body.name;
  var pwd = req.body.pwd;
  var nickname = req.body.nickname;
  var age = parseInt(req.body.age);
  var sex = req.body.sex;
  var isAdmin = req.body.isAdmin === '是' ? true : false;
  // 链接数据库
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    // MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      res.render("error", {
        message: "链接失败",
        error: err
      })
      return;
    }
    var db = client.db("project");

    async.series([

      // 确认是否注册了
      function (cb) {
        db.collection("user").find({ username: name }).count(function (err, num) {
          if (err) {
            //链接错误信息
            cb(err)
          } else if (num > 0) {
            // 已经注册了
            cb(new Error("已经注册"));
          } else {
            // 注册成功
            cb(null);
          }
        })
      },
      // 没有注册，插入注册
      function (cb) {
        db.collection("user").insertOne({
          // db.collection('user').insertOne({
          username: name,
          password: pwd,
          nickname: nickname,
          age: age,
          sex: sex,
          isAdmin: isAdmin
        }, function (err) {
          if (err) {
            cb(err);
          } else {
            cb(null);
          }

        })
      }
    ], function (err, result) {
      if (err) {
        res.render("error", {
          message: "错误",
          error: err
        })
      } else {
        res.redirect("/login.html")

      }
      client.close();
    })
  })
})

/***** 用户删除********* */
// 删除操作 localhost:3000/users/delete
router.get('/delete', function (req, res) {
  var id = req.query.id;
  // 链接数据库
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      res.render("error", {
        message: "链接失败",
        error: err
      })
      return;
    }
    var db = client.db("project");
    db.collection("user").deleteOne({

      _id: ObjectId(id)
    }, function (err, data) {
      console.log(data)
      if (err) {
        res.render("error", {
          message: "删除失败",
          error: err
        })
      } else {
        res.redirect("/users")
      }
      client.close();
    })
  })
})


/**** 修改用户****  */



module.exports = router;
