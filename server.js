"use strict";
require('dotenv').config()
var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
const bodyParser = require("body-parser");
var cors = require("cors");
var app = express();
var port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.text({}));
app.use("/public", express.static(process.cwd() + "/public"));
app.get("/", function (req, res, next) {
  res.sendFile(process.cwd() + "/index.html");
});

// DATABASE SETUP

mongoose.connect(process.env.DB_URI);
const Schema = mongoose.Schema;
const linkSchema = new Schema({
  long: String,
  short: String,
  code: String,
  host: String,
  path: String,
});
const LINK = mongoose.model("LINK", linkSchema);

const createEntry = function (data) {
  const entry = new LINK({
    long: data.long,
    short: data.short,
    host: data.host,
    path: data.path,
    code: data.code,
  });

  entry.save(function (err, url) {
    if (err) {
      console.log(err);
    }
  });
};

// databse request

app.post("/database", function (req, res) {
  LINK.find({}, function (err, result) {
    if (err) {
      console.log(err);
    }
    console.log(result);
    res.json({ res: result });
  });
});

// POST REQUEST

// generate random string

function generateId(len) {
  let r = Math.random().toString(36).substring(len);
  return r;
}

app.post(
  "/",

  function (req, res, next) {
    let body = JSON.parse(req.body);
    if (body.newId) {
      LINK.updateOne(
        { code: body.oldId },
        {
          code: body.newId,
          short: `${body.url}${body.newId}`,
        },
        function (err, res) {}
      );
      res.end();
    } else {
      res.locals.url = JSON.parse(req.body).url + "/";

      console.log(res.locals.url);

      LINK.findOne({ long: res.locals.url }, "code", function (err, result) {
        if (err) {
          console.log(err);
          res.end();
        }
        if (result) {
          console.log("query result", result);
          res.json(result);
        } else {
          console.log("no query result", result);
          next();
        }
      });
    }
  },

  function (req, res) {
    const fullUrl = req.protocol + "://" + req.get("host") + "/";
    const hash = generateId(5);
    const shortened_url = fullUrl + hash;

    const url = new URL(res.locals.url);

    const data = {
      long: url.href,
      short: shortened_url,
      host: url.hostname,
      path: url.pathname,
      code: hash,
    };

    createEntry(data);

    console.log("created new entry:", data);

    res.json(data);
  }
);

// delete documents rquest handler

app.post("/delete", function (req, res) {
  if (req.body) {
    let id = req.body;
    console.log(id);
    LINK.deleteOne({ code: id }, function (err, data) {});
  } else {
    LINK.deleteMany({}, function (err, data) {});
  }
});

// GET Request

app.get("/:shortened_url", function (req, res) {
  const short = req.params.shortened_url;

  if (short == "favicon.ico") {
    res.end();
  } else {
    LINK.findOne({ code: short }, "long", function (err, url) {
      if (err) {
        console.log("no such url");
        res.end();
      } else {
        console.log("fetched url", url);
        res.redirect(url.long);
      }
    });
  }
});

app.listen(port, function () {
  console.log("Node.js listening at http://localhost:3000/");
});
