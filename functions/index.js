const functions = require("firebase-functions");
const express = require("express");
const { db } = require("./util/admin");

const {
  getAllScreams,
  postOneScream,
  getScream,
  deleteScream,
  likeScream,
  unlikeScream,
  commentOnScream
} = require("./handlers/screams");

const {
  register,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/users");
const FBAuth = require("./util/fbAuth");

const app = express();

// Get all data
app.get("/screams", getAllScreams);
// Create data
app.post("/screams", FBAuth, postOneScream);
// Get scream
app.get("/screams/:screamId", getScream);
// Delete scream
app.delete("/screams/:screamId", FBAuth, deleteScream);
// Like scream
app.get("/screams/:screamId/like", FBAuth, likeScream);
// Unlike scream
app.get("/screams/:screamId/unlike", FBAuth, unlikeScream);
// Commenting on scream
app.post("/screams/:screamId/comment", FBAuth, commentOnScream);
// Upload user image
app.post("/user/image", FBAuth, uploadImage);
// User details
app.post("/user", FBAuth, addUserDetails);
// Get data user
app.get("/user", FBAuth, getAuthenticatedUser);
// get User details
app.get("/user/:handle", getUserDetails);
// Mark as read notification
app.post("/notifications", FBAuth, markNotificationsRead);

// Register User
app.post("/register", register);
// Login route
app.post("/login", login);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });
exports.deleteNotificationOnUnLike = functions.firestore
  .document("likes/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });
exports.createNotificationOnComment = functions.firestore
  .document("comments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });
