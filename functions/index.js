const functions = require("firebase-functions");
const express = require("express");

const { getAllScreams, postOneScream } = require("./handlers/screams");
const {
  register,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");
const FBAuth = require("./util/fbAuth");

const app = express();

// Get all data
app.get("/screams", getAllScreams);
// Create data
app.post("/screams", FBAuth, postOneScream);
// Upload user image
app.post("/user/image", FBAuth, uploadImage);
// User details
app.post("/user", FBAuth, addUserDetails);

app.get("/user", FBAuth, getAuthenticatedUser);

// Register User
app.post("/register", register);
// Login route
app.post("/login", login);

exports.api = functions.https.onRequest(app);
