var express = require("express");
var router = express.Router();
var upload = require("../utils/multer");
var fs = require("fs");
var path = require("path");


var User = require("../models/userModel");
var Post = require("../models/postModel");
var passport = require("passport");
var LocalStrategy = require("passport-local");
const user = require("../models/userModel");
const { render } = require("ejs");

// passport.use(User.createStrategy());
passport.use(new LocalStrategy(User.authenticate()));
//
router.get("/add-comment/:id", isLoggedIn, (req, res) => {
  res.render("comment");
});
router.post("/add-comment", isLoggedIn, (req, res) => {
  console.log("running");
  console.log(req.user._id);
  const comment = req.body.comment;
  const postedBy = req.user.id.toString().replace(/ObjectId\("(.*)"\)/, "$1");
  const commentId = req.body.commentId;
  console.log(postedBy, commentId, comment);
  Post.findByIdAndUpdate(
    commentId,
    { $push: { comments: comment } },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.send(err);
    } else {
      console.log(result);
      res.json(result);
    }
  });
});
/** GET Signin page */
router.get("/", function (req, res, next) {
  res.render("signin", {
    title: "Sign in",
    isloggedin: req.user ? true : false,
    user: req.user,
  });
});

router.post(
  "/signin",
  passport.authenticate("local", {
    successRedirect: "/timeline",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);

/** GET Signup page */
router.get("/signup", function (req, res, next) {
  res.render("signup", {
    title: "Sign up",
    isloggedin: req.user ? true : false,
    user: req.user,
  });
});

/** POST Signup page */
router.post("/signup", function (req, res, next) {
  var { email, name, password, username } = req.body;
  var newUser = new User({ name, email, username });
  User.register(newUser, password)
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => res.send(err));
});

router.get("/timeline", isLoggedIn, function (req, res) {
  Post.find()
    .populate("postedBy")
    .then(function (posts) {
      res.render("homepage", {
        title: req.user ? req.user.username : null,
        isloggedin: req.user ? true : false,
        user: req.user,
        posts,
      });
    })
    .catch(function (err) {
      res.send(err);
    });
});

router.get("/create-post", isLoggedIn, function (req, res) {
  res.render("createpost", {
    title: "Create Post",
    isloggedin: req.user ? true : false,
    user: req.user,
  });
});

router.post("/c", upload.single("multimedia"), function (req, res) {
  console.log("object");
  const { title, content } = req.body;
  const newpost = new Post({
    title,
    content,
    multimedia: req.file.filename,
    postedBy: req.user,
  });
  newpost
    .save()
    .then(function (createdpost) {
      req.user.posts.push(createdpost);
      req.user.save();
      res.redirect("/timeline");
    })
    .catch(function (err) {
      res.send(err);
    });
});

router.get("/like/:id", isLoggedIn, function (req, res) {
  Post.findById(req.params.id)
    .then(function (likedpost) {
      if (likedpost.dislikes.includes(req.user._id)) {
        const idx = likedpost.dislikes.findIndex(function (id) {
          return req.user._id === id;
        });
        likedpost.dislikes.splice(idx, 1);
      }

      if (!likedpost.likes.includes(req.user._id)) {
        likedpost.likes.push(req.user);
      }
      likedpost.save();
      res.redirect("/timeline");
    })
    .catch(function (err) {
      res.send(err);
    });
});

router.get("/dislike/:id", isLoggedIn, function (req, res) {
  Post.findById(req.params.id)
    .then(function (dislikedpost) {
      if (dislikedpost.likes.includes(req.user._id)) {
        const idx = dislikedpost.likes.findIndex(function (id) {
          return req.user._id === id;
        });
        dislikedpost.likes.splice(idx, 1);
      }

      if (!dislikedpost.dislikes.includes(req.user._id)) {
        dislikedpost.dislikes.push(req.user);
      }
      dislikedpost.save();
      res.redirect("/timeline");
    })
    .catch(function (err) {
      res.send(err);
    });
});

router.get("/logout", function (req, res) {
  req.logout(function () {
    res.redirect("/");
  });
});

router.get("/forgot-password", function (req, res) {
  res.render("forget", {
    title: "Forget Password",
    isloggedin: req.user ? true : false,
    user: req.user,
  });
});




router.post("/change-password/:id", function (req, res) {
  User.findById(req.params.id)
    .then(function (userFound) {
      if (!userFound)
        return res.send(
          "User not found <a href='/forgot-password'>go back</a>"
        );

      userFound.setPassword(req.body.password, function (err, user) {
        if (err) {
          res.send(err);
        }
        userFound.refreshToken = undefined;
        userFound.save();
        res.redirect("/");
      });
    })
    .catch(function (err) {
      res.send(err);
    });
});

router.get("/reset-password", isLoggedIn, function (req, res) {
  res.render("reset", {
    title: "Reset Password",
    isloggedin: req.user ? true : false,
    user: req.user,
  });
});

router.post("/reset-password", function (req, res) {
  const { oldpassword, newpassword } = req.body;

  req.user.changePassword(oldpassword, newpassword, function (err, user) {
    if (err) {
      res.send(err);
    }
    res.redirect("/logout");
  });
});

/** GET Profile page */
router.get("/profile", isLoggedIn, function (req, res, next) {
  res.render("profile", {
    title: "Profile",
    isloggedin: req.user ? true : false,
    user: req.user,
  });
});
router.get("/show-profile", isLoggedIn, (req, res) => {
  console.log(req.user.id);
  Post.find({ postedBy: req.user.id }).then((data) => {
    console.log(data);
    res.render("showProfile", {
      title: "Profile",
      isloggedin: req.user ? true : false,
      user: req.user,
      data: data,
    });
  });
});
/** POST Profile/:id page */
router.post("/profile/:id", isLoggedIn, function (req, res, next) {
  User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    .then(function (data) {
      console.log(data);
      res.render("profile", {
        user: req.user,
        data: data,
        isloggedin: req.user ? true : false,
      });
    })
    .catch(function (err) {
      res.send(err);
    });
});

/** POST /uploadimage/:id page */
router.post(
  "/uploadimage/:id",
  isLoggedIn,
  upload.single("avatar"),
  function (req, res, next) {
    // upload(req, res, function (err) {
    // if (err) res.send(err);
    User.findByIdAndUpdate(
      req.params.id,
      { $set: { avatar: req.file.filename } },
      { new: true }
    )
      .then(function () {
        if (req.body.oldavatar !== "dummy.png") {
          fs.unlinkSync(
            path.join(__dirname, "..", "public", "assets", req.body.oldavatar)
          );
        }
        res.redirect("/profile");
      })
      .catch(function (err) {
        res.send(err);
      });
    // })
  }
);

router.get("/delete-user", isLoggedIn, function (req, res, next) {
  User.findById(req.user._id)
    .populate("posts")
    .then(function (user) {
      user.posts.forEach(function (post) {
        Post.findByIdAndDelete(post._id).then(function (deletedpost) {
          fs.unlinkSync(
            path.join(
              __dirname,
              "..",
              "public",
              "assets",
              deletedpost.multimedia
            )
          );
        });
      });

      User.findByIdAndDelete(req.user._id)
        .then(function () {
          res.redirect("/");
        })
        .catch(function (err) {
          res.send(err);
        });
    })
    .catch(function (err) {
      res.sendFile(err);
    });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.redirect("/");
}

module.exports = router;
