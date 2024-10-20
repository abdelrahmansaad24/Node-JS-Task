const express = require('express');
const asyncHandler = require('express-async-handler');
const authMiddleware = require('../middlewares/authMiddleware');
const Book = require('../models/Book');
const User = require('../models/User');
const Borrowing = require('../models/Borrowing')
require('../utils/authTokenGenerator');
const borrowingRouter = express.Router();

//borrow a book

borrowingRouter.post('/borrow/:id',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id);
        if (user){
            const book = await Book.findById(req.params.id);
            if(book) {
                if(book.copies > 0){
                    const title = await book.title;
                    const borrowedBy = await user._id;
                    const bookId = await book._id;
                    const start = Date.now();
                    const returned = false;
                    book.copies -=1;
                    await book.save();
                    const borrowing = await Borrowing.create({ title, borrowedBy, bookId, start,returned });
                    res.status(201);
                    res.json(borrowing);
                }
                else {
                    res.status(404);
                    throw new Error('No enouph copies');
                }
            }
            else {
                res.status(404);
                throw new Error('book not found');
            }

        }
        else {
            res.status(401);
            throw new Error('User Not found');
        }
    })
);

//return a book

borrowingRouter.post('/return/:id',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id);
        if (user){
            const borrow = await Borrowing.findById(req.params.id);
            if(borrow) {
                console.log(borrow.bookId);
                const book = await Book.findById(borrow.bookId);
                if(book) {
                    book.copies += 1;
                    borrow.returned = true
                    borrow.end = Date.now();
                    const returndBook = await borrow.save();
                    await book.save();
                    res.status(200);
                    res.json(returndBook);
                }
                else {
                    res.status(404);
                    throw new Error('book not found');
                }
            }
            else {
                res.status(404);
                throw new Error('borrowing not found');
            }

        }
        else {
            res.status(401);
            throw new Error('User Not found');
        }
    })
);


// get books borrowed by a user

borrowingRouter.get(
    '/borrowed',
    authMiddleware,
    asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if(user){
                const activeBorrowings = await Borrowing.find({
                    borrowedBy: user._id,   // Match the user by ID
                    returned: false       // Only get borrowings that are not returned
                }).populate('bookId', 'title author') // Optionally populate book details
                    .exec();
                res.status(200);
                res.json(activeBorrowings);
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

borrowingRouter.get(
    '/popular/:n',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id).populate('books');
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

module.exports = { borrowingRouter };
