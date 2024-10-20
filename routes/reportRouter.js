const express = require('express');
const asyncHandler = require('express-async-handler'); // For handling asynchronous operations
const authMiddleware = require('../middlewares/authMiddleware'); // Authentication middleware
const Book = require('../models/Book'); // Book model
const User = require('../models/User'); // User model
const Borrowing = require('../models/Borrowing'); // Borrowing model
require('../utils/authTokenGenerator'); // Auth token utility
const reportRouter = express.Router(); // Create an Express router

// Get books currently borrowed (not returned)
reportRouter.get(
    '/borrowed',
    authMiddleware, // Ensure user is authenticated
    asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.user.id); // Find the user by ID
            if (user && user.admin) { // Check if user exists and is an admin
                const currentlyBorrowedBooks = await Borrowing.find({
                    returned: false // Only books that have not been returned
                })
                .populate('bookId', 'title author') // Populate book details (optional fields)
                .populate('borrowedBy', 'name email') // Populate user details who borrowed the book
                .exec();

                res.status(200).json(currentlyBorrowedBooks); // Respond with currently borrowed books
            } else {
                throw new Error(`You don't have any profile yet`); // Handle user not found or not an admin
            }
        } catch (error) {
            res.status(500); // Server error
            throw new Error('Server error');
        }
    })
);

// Get report about most popular n books
reportRouter.get(
    '/popular/:n',
    authMiddleware, // Ensure user is authenticated
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id); // Find the user by ID
        if (!user || !user.admin) { // Check if user exists and is an admin
            res.status(401);
            throw new Error(`Unauthorized access`); // Handle unauthorized access
        }
        try {
            const n = parseInt(req.params.n, 10); // Parse the number of top books to return
            const result = await Borrowing.aggregate([
                {
                    $group: {
                        _id: '$bookId', // Group by bookId
                        borrowCount: { $sum: 1 }, // Count the number of borrowings
                    },
                },
                {
                    $sort: { borrowCount: -1 }, // Sort by borrowCount in descending order
                },
                {
                    $limit: n, // Limit to top n results
                },
                {
                    $lookup: {
                        from: 'Books', // The collection where book details are stored
                        localField: '_id',
                        foreignField: '_id',
                        as: 'bookDetails',
                    },
                },
                {
                    $project: {
                        _id: 0, // Exclude the MongoDB ID
                        bookId: '$_id', // Include the bookId
                        borrowCount: 1, // Include the borrow count
                        bookDetails: { $arrayElemAt: ['$bookDetails', 0] }, // Include book details
                    },
                },
            ]);
            res.status(200).json(result); // Respond with the popular books
        } catch (error) {
            res.status(500); // Server error
            throw new Error('Error fetching popular books:'); // Handle errors during aggregation
        }
    })
);

module.exports = { reportRouter }; // Export the reportRouter
