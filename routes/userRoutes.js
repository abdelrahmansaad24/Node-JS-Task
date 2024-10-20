const express = require('express');
const asyncHandler = require('express-async-handler'); // Middleware for handling async errors
const authMiddleware = require('../middlewares/authMiddleware'); // Authentication middleware
const User = require('../models/User'); // User model
const authTokenGenerator = require('../utils/authTokenGenerator'); // Token generation utility
const userRouter = express.Router(); // Create an Express router
const validator = require('validator'); // Input validation library
const Book = require("../models/Book"); // Book model (if needed)
const Borrowing = require("../models/Borrowing"); // Borrowing model

// Create user
userRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, admin } = req.body; // Destructure user data
    const userExist = await User.findOne({ email }); // Check if user exists

    if (userExist) {
      throw new Error('User already exists'); // Better error message
    }
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email'); // Validate email format
    }
    if (!validator.isStrongPassword(password)) {
      throw new Error('Password is too weak'); // Validate password strength
    }
    const user = await User.create({ name, email, password, admin }); // Create user
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: authTokenGenerator(user._id), // Generate token
      });
    }
  })
);

// User login
userRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body; // Destructure login data
    const user = await User.findOne({ email }); // Find user by email
    // Compare password
    if (user && (await user.isPasswordMatch(password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: authTokenGenerator(user._id), // Generate token
      });
    } else {
      res.status(401);
      throw new Error('Invalid login credentials'); // Invalid login response
    }
  })
);

// GET USER PROFILE
userRouter.get(
  '/profile',
  authMiddleware, // Ensure the user is authenticated
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user.id); // Find the user by ID
      if (!user) {
        res.status(401);
        throw new Error(`You don't have any profile yet`); // User not found
      }
      res.status(200).send(user); // Return user profile
    } catch (error) {
      res.status(500);
      throw new Error('Server error'); // Handle server errors
    }
  })
);

// UPDATE USER PROFILE
userRouter.put(
  '/profile/update',
  authMiddleware, // Ensure the user is authenticated
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id); // Find the user by ID
    if (user) {
      user.name = req.body.name || user.name; // Update name if provided
      user.email = req.body.email || user.email; // Update email if provided
      // Validate and update password
      if (req.body.password) {
        if (validator.isStrongPassword(req.body.password)) {
          user.password = req.body.password; // Update password (auto-encrypt)
        } else {
          throw new Error('Invalid password'); // Invalid password response
        }
      }
      const updatedUser = await user.save(); // Save updated user
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        token: authTokenGenerator(updatedUser._id), // Generate token
      });
    } else {
      res.status(401);
      throw new Error('User not found'); // User not found response
    }
  })
);

// Get borrowing history
userRouter.get(
  '/history',
  authMiddleware, // Ensure the user is authenticated
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id); // Find the user by ID
    if (user) {
      const result = await Borrowing.find({ borrowedBy: user._id }); // Fetch borrowing history
      res.status(200).json(result); // Return borrowing history
    } else {
      res.status(401);
      throw new Error(`You don't have any profile yet`); // User not found
    }
  })
);

module.exports = { userRouter }; // Export the user router
