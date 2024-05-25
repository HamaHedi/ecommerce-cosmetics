const Message = require("../models/message");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");
const AsyncHandler = require("express-async-handler");
const ObjectID = require("mongodb").ObjectId;
const path = require("path");
const fs = require("fs");


exports.createMessage = AsyncHandler(async (req, res, next) => {
    const { email, name, message } = req.body;
  
    const newMessage = new Message({
      email,
      name,
      message
    });
  
    await newMessage.save();
  
    res.status(201).json({
      success: true,
      data: newMessage,
    });
  });

  

exports.getAllMessages = AsyncHandler(async (req, res, next) => {
    const messages = await Message.find();
  
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  });