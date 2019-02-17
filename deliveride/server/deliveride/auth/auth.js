const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

var LocalStrategy = require("passport-local").Strategy;
var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");

//require models
const User = require("../models/userModel");
const bookModel = require("../models/bookModel");
const Driver = require("../models/driverModel");

//Local Strategy
passport.use("user", new LocalStrategy(User.authenticate()));
passport.use("driver", new LocalStrategy(Driver.authenticate()));

//jwt options
var options = {};
options.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
options.secretOrKey = "7x0jhxt&quot;9(thpX6";

//JWT Strategy
passport.use(
  "user_jwt",
  new JwtStrategy(options, function(jwt_payload, done) {
    User.findOne(
      {
        _id: jwt_payload.id
      },
      function(err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      }
    );
  })
);

passport.use(
  "driver_jwt",
  new JwtStrategy(options, function(jwt_payload, done) {
    Driver.findOne(
      {
        _id: jwt_payload.id
      },
      function(err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      }
    );
  })
);
