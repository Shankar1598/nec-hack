const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportModule = require("../auth/auth");

//require models
const User = require("../models/userModel");
const bookModel = require("../models/bookModel");
const Driver = require("../models/driverModel");

//jwt options
var options = {};
options.secretOrKey = "7x0jhxt&quot;9(thpX6";

//user register
router.post("/:name/register", function(req, res) {
  let authType = req.params.name;

  const createUser = () => {
    User.register(
      new User({ username: req.body.username }),
      req.body.password,
      function(err, user) {
        if (err) {
          console.log(err);
        }
        res.status(200).send({ user: user.id });
      }
    );
  };

  const createDriver = () => {
    Driver.register(
      new Driver({ username: req.body.username }),
      req.body.password,
      function(err, user) {
        if (err) {
          console.log(err);
        }
        res.status(200).send({ user: user.id });
      }
    );
  };

  switch (authType) {
    case "user":
      createUser();
      break;
    case "driver":
      createDriver();
      break;
  }
});

//userlogin
router.post("/:name/login", function(req, res, next) {
  let authType = req.params.name;

  passport.authenticate(authType, function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    if (user) {
      var token = jwt.sign(
        { id: user._id, username: user.username },
        options.secretOrKey
      );
      return res.status(200).json({ token });
    }
  })(req, res, next);
});

module.exports = router;
