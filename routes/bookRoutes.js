const express = require('express');
const asyncHandler = require('express-async-handler'); // To handle async operations and catch errors
const authMiddleware = require('../middlewares/authMiddleware'); // Custom middleware for authentication
const Book = require('../models/Book'); // Book model
const User = require('../models/User'); // User model
const Borrow = require('../models/Borrowing'); // Borrowing model
require('../utils/authTokenGenerator'); // Auth token utility
const bookRouter = express.Router(); // Create an Express router

// Create a new book (only admins can add books)
bookRouter.post(
  '/',
  authMiddleware, // Ensure user is authenticated
  asyncHandler(async (req, res) => {
    try {
      // Find the authenticated user by ID
      const user = await User.findById(req.user.id);
      // Check if the user exists and is an admin
      if (user && user.admin) {
        // Create the book with the provided data
        const book = await Book.create(req.body);
        res.status(201).json(book); // Respond with the created book and 201 status
      } else {
        res.status(401);
        throw new Error("Invalid adding credentials");
      }
    } catch (error) {
      res.status(500);
      throw new Error(error); // Handle server errors
    }
  })
);

// Get all books
bookRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    // Check if the user is an admin
    const books = await Book.find(); // Fetch all books
    res.status(200).send(books); // Send the books back
    
  })
);

// Delete a book (only admins can delete, and the book shouldn't be borrowed)
bookRouter.delete(
  '/:id',
  authMiddleware, // Ensure user is authenticated
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user.id); // Get the user
      const borrow = await Borrow.find({ bookId: req.params.id }); // Check if the book is borrowed

      // Ensure the user is admin and the book is not borrowed
      if (user && user.admin && borrow.length === 0) {
        const book = await Book.findByIdAndDelete(req.params.id); // Delete the book by ID
        if (book) {
          res.status(204).send("No content"); // Send a 204 status if deleted
        } else {
          res.status(404).send("Book not found"); // Book not found
        }
      } else {
        res.status(401);
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      res.status(500);
      throw new Error('Server Error');
    }
  })
);

// Update a book's details (only admins can update books)
bookRouter.put(
  '/:id',
  authMiddleware, // Ensure user is authenticated
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user.id); // Find the user by ID
      if (user && user.admin) {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body); // Update the book with new data
        res.status(200).json(book); // Respond with updated book data
      } else {
        res.status(401);
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      res.status(500);
      throw new Error('Update failed');
    }
  })
);

// Search for books based on various filters (open to all users)
bookRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    try {
      // Extract query parameters from the request body
      const { category, author, title, minCopies } = req.body;
      
      // Build a dynamic query object
      const query = {};
      if (category) query.category = category; // Filter by category
      if (author) query.author = { $regex: author, $options: 'i' }; // Case-insensitive author search
      if (title) query.title = { $regex: title, $options: 'i' }; // Case-insensitive title search
      if (minCopies) query.copies = { $gte: parseInt(minCopies) }; // Minimum available copies

      // Fetch books based on the query
      const books = await Book.find(query);

      // Return the results
      res.status(200).json(books);
    } catch (error) {
      res.status(500);
      throw new Error('No book found');
    }
  })
);

// Get a specific book by its ID (open to all users)
bookRouter.get(
  '/get/:id',
  asyncHandler(async (req, res) => {
    try {
      const book = await Book.findById(req.params.id); // Find the book by its ID
      if (book) {
        res.status(200).send(book); // Respond with the book details
      } else {
        res.status(404).send('Book not found'); // Book not found
      }
    } catch (error) {
      res.status(500);
      throw new Error('No book found');
    }
  })
);

module.exports = { bookRouter }; // Export the bookRouter
