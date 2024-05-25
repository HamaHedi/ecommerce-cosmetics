const express = require("express");
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { createMessage, getAllMessages } = require("../controllers/message");


router.route("/messages").post(createMessage);


router
  .route("/messages")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllMessages);

module.exports = router;
