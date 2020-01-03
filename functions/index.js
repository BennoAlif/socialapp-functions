const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const firebase = require("firebase");

// Firebase Config
var firebaseConfig = {
  apiKey: "AIzaSyBKO9S8_6l763ElU4H0ewb3qPjzyrrvJ6Q",
  authDomain: "social-app-cc395.firebaseapp.com",
  databaseURL: "https://social-app-cc395.firebaseio.com",
  projectId: "social-app-cc395",
  storageBucket: "social-app-cc395.appspot.com",
  messagingSenderId: "371103379874",
  appId: "1:371103379874:web:caa02dc83ae0fd265542fb",
  measurementId: "G-05V0QQ8LGQ"
};
firebase.initializeApp(firebaseConfig);

admin.initializeApp();

const app = express();

const db = admin.firestore();

// Get all data
app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          id: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch(err => {
      console.log(err);
    });
});

// Create data
app.post("/screams", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db.collection("screams")
    .add(newScream)
    .then(doc => {
      res.json({
        message: `Document ${doc.id} created successfully`
      });
    })
    .catch(err => {
      res.status(500).json({
        error: "Something went wrong"
      });
      console.log(err);
    });
});

// Register User
app.post("/register", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let token, userId;

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      // Cek user udah ada apa belum
      if (doc.exists) {
        return res.status(400).json({
          handle: "This handle is already taken"
        });
      } else {
        //   Kalau gak ada, buat user
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      // Isi user id
      userId = data.user.uid;
      //   return Token
      return data.user.getIdToken();
    })
    .then(idToken => {
      // Isi Token
      token = idToken;
      const userCredentials = {
        userId,
        email: newUser.email,
        handle: newUser.handle,
        createdAt: new Date().toISOString()
      };

      //   Set document user
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.log(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({
          email: "Email is already in use"
        });
      } else {
        return res.status(500).json({
          error: err.code
        });
      }
    });
});

exports.api = functions.https.onRequest(app);
