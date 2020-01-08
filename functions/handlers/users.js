const { db } = require("../util/admin");
const firebase = require("firebase");
const { validateRegisterData, validateLoginData } = require("../util/validators");

const config = require("../util/config");
firebase.initializeApp(config);

exports.register = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  const { valid, errors } = validateRegisterData(newUser);
  if(!valid) return res.status(400).json(errors)

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
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const { valid, errors } = validateLoginData(user);
  if(!valid) return res.status(400).json(errors)

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.log(err);
      if (err.code === "auth/wrong-password") {
        return res.status(403).json({
          general:
            "The password is invalid or the user does not have a password."
        });
      } else return res.status(500).json({ error: err.code });
    });
};
