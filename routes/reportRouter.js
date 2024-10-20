const express = require('express');
const asyncHandler = require('express-async-handler');
const authMiddleware = require('../middlewares/authMiddleware');
const Book = require('../models/Book');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing')
require('../utils/authTokenGenerator');
const reportRouter = express.Router();

// get books borrowed by a user

reportRouter.get(
    '/borrowed',
    authMiddleware,
    asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if(user && user.admin){
                const currentlyBorrowedBooks = await Borrowing.find({
                    returned: false // Only books that have not been returned
                })
                    .populate('bookId', 'title author') // Populate book details (optional fields like title and author)
                    .populate('borrowedBy', 'name email') // Optionally populate user details who borrowed the book
                    .exec();

                res.status(200).json(currentlyBorrowedBooks);
            }else {
                throw new Error(`You don't have any profile yet`);
            }
        } catch (error) {
            res.status(500);
            throw new Error('Server error');
        }
    })
);

// get report about most popular n books

reportRouter.get(
    '/popular/:n',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id);
        if (!user || !user.admin) {
            res.status(401)
            throw new Error(`unauthorized access`);
        }
        console.log("why")
        try {
            const n = parseInt(req.params.n, 10);
            const result = await Borrowing.aggregate([
                // Group by bookId and count the number of borrowings per book
                {
                    $group: {
                        _id: '$bookId', // Group by bookId
                        borrowCount: { $sum: 1 }, // Count the number of borrowings
                    },
                },
                // Sort by borrowCount in descending order
                {
                    $sort: { borrowCount: -1 },
                },
                // Limit to top n results
                {
                    $limit: n,
                },
                // Optionally, look up the book details if needed
                {
                    $lookup: {
                        from: 'Books', // The collection where book details are stored
                        localField: '_id',
                        foreignField: '_id',
                        as: 'bookDetails',
                    },
                },
                // Optionally, project only the necessary fields
                {
                    $project: {
                        _id: 0, // Exclude the MongoDB ID
                        bookId: '$_id',
                        borrowCount: 1,
                        bookDetails: { $arrayElemAt: ['$bookDetails', 0] }, // Include book details
                    },
                },
            ]);
            res.status(200);
            res.json(result);
        } catch (error) {
            res.status(500)
            throw new Error('Error fetching popular books:');
        }
        })
)

module.exports = { reportRouter };
