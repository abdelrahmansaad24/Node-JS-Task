const asynchHandler = require('express-async-handler'); // Import express-async-handler to handle exceptions in async routes
const jwt = require('jsonwebtoken'); // Import jsonwebtoken to work with JWTs (JSON Web Tokens)
const User = require('../models/User'); // Import the User model to interact with user data in the database

// Middleware to authenticate users using JWT
// We retrieve the token from the header, decode it to get the user ID, and then attach the user to the request object

const authMiddleware = asynchHandler(async (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract the token by splitting the authorization header
      token = req.headers.authorization.split(' ')[1];

      // Decode the token to verify the user's identity using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in the database based on the decoded user ID
      const user = await User.findById(decoded.id);

      // Attach the user information to the request object as req.user
      req.user = user;

      // Move on to the next middleware or route handler
      next();
    } catch (error) {
      // If there's an error verifying the token, respond with a 401 Unauthorized status
      res.status(401);
      throw new Error('Not authorized, token is invalid');
    }
  }

  // If no token is found in the request, respond with a 401 Unauthorized status
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

module.exports = authMiddleware;
