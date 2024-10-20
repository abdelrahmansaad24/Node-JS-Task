const express = require('express');
const asyncHandler = require('express-async-handler'); // To handle async operations and catch errors
const authMiddleware = require('../middlewares/authMiddleware'); // Custom middleware for authentication
const Book = require('../models/Book'); // Book model
const User = require('../models/User'); // User model
const Borrowing = require('../models/Borrowing'); // Borrowing model
require('../utils/authTokenGenerator'); // Auth token utility
const borrowingRouter = express.Router(); // Create an Express router

// Borrow a book
borrowingRouter.post('/borrow/:id',
    authMiddleware, // Ensure user is authenticated
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id); // Find the user by ID
        if (user) {
            const book = await Book.findById(req.params.id); // Find the book by ID
            if (book) {
                if (book.copies > 0) { // Check if copies are available
                    const title = book.title;
                    const borrowedBy = user._id;
                    const bookId = book._id;
                    const start = Date.now(); // Start time for borrowing
                    const returned = false; // Initially set returned to false
                    book.copies -= 1; // Decrease the number of available copies
                    await book.save(); // Save the updated book

                    // Create a new borrowing record
                    const borrowing = await Borrowing.create({ title, borrowedBy, bookId, start, returned });
                    res.status(201).json(borrowing); // Respond with the new borrowing record
                } else {
                    res.status(404);
                    throw new Error('Not enough copies available'); // Handle insufficient copies
                }
            } else {
                res.status(404);
                throw new Error('Book not found'); // Handle book not found
            }
        } else {
            res.status(401);
            throw new Error('User not found'); // Handle user not found
        }
    })
);

// Return a book
borrowingRouter.post('/return/:id',
    authMiddleware, // Ensure user is authenticated
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id); // Find the user by ID
        if (user) {
            const borrow = await Borrowing.findById(req.params.id); // Find the borrowing record by ID
            if (borrow) {
                const book = await Book.findById(borrow.bookId); // Find the corresponding book
                if (book) {
                    book.copies += 1; // Increase the number of available copies
                    borrow.returned = true; // Mark the borrowing as returned
                    borrow.end = Date.now(); // Set the end time for borrowing
                    const returnedBook = await borrow.save(); // Save the updated borrowing record
                    await book.save(); // Save the updated book
                    res.status(200).json(returnedBook); // Respond with the updated borrowing record
                } else {
                    res.status(404);
                    throw new Error('Book not found'); // Handle book not found
                }
            } else {
                res.status(404);
                throw new Error('Borrowing record not found'); // Handle borrowing record not found
            }
        } else {
            res.status(401);
            throw new Error('User not found'); // Handle user not found
        }
    })
);

// Get books borrowed by a user
borrowingRouter.get(
    '/borrow/history',
    authMiddleware, // Ensure user is authenticated
    asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.user.id); // Find the user by ID
            if (user) {
                const activeBorrowings = await Borrowing.find({
                    borrowedBy: user._id // Match borrowings by the user's ID
                }).populate('bookId', 'title author') // Optionally populate book details
                  .exec();
                res.status(200).json(activeBorrowings); // Respond with active borrowings
            } else {
                throw new Error(`You don't have any profile yet`); // Handle user not found
            }
        } catch (error) {
            res.status(500);
            throw new Error('Server error'); // Handle server errors
        }
    })
);

module.exports = { borrowingRouter }; // Export the borrowingRouter
