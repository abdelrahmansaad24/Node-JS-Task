const express = require('express');
const asyncHandler = require('express-async-handler');
const authMiddleware = require('../middlewares/authMiddleware');
const Book = require('../models/Book');
const User = require('../models/User');
const Borrow = require('../models/Borrowing')
require('../utils/authTokenGenerator');
const bookRouter = express.Router();

//Create Book
bookRouter.post(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if(user && user.admin){
            const book = await Book.create(req.body);
            res.status(201);
            res.json(book);
        }
        else {
            res.status(401);
            throw new Error("Invalid adding credentials");
        }
    } catch (error) {
      res.status(500);
      throw new Error(error);
    }
  })
);

// get all books

bookRouter.get(
  '/',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id);
        if (user && user.admin) {
            const books = await Book.find();
            //Compare password
            if (books) {
                res.status(200);
                res.send(books);
            }
        } else {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    }
  )
);

//Delete book

bookRouter.delete(
  '/:id',
    authMiddleware,
    asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const borrow = await Borrow.find({ bookId: req.params.id });
        if (user && user.admin && borrow !== []) {
            const book = await Book.findByIdAndDelete(req.params.id);
            if (book) {
                res.status(204);
                res.send("No content");
            } else {
                res.status(404)
            }
        }
        else {
            res.status(401);
            throw new Error('Invalid credentials');
        }

    } catch (error) {
        res.status(500);
        throw new Error('Server Error');
    }
    })
);

//Update

bookRouter.put(
    '/:id',
    authMiddleware,
    asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user && user.admin) {
            const book = await Book.findByIdAndUpdate(req.params.id, req.body);
            res.status(200);
            res.json(book);
        }
        else {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        res.status(500);
        throw new Error('Update failed');
    }
    })
);

//search books

bookRouter.get(
    '/search',
    asyncHandler(async (req, res) => {
        console.log("here");
        try {
            console.log(req.query)
            // Extract query parameters from the request
            const { category, author, title, minCopies } = req.body;

            // Build a dynamic query object
            const query = {};

            if (category) {
                query.category = category;
            }
            if (author) {
                query.author = { $regex: author, $options: 'i' }; // Case-insensitive search for author
            }
            if (title) {
                query.title = { $regex: title, $options: 'i' }; // Case-insensitive search for title
            }
            if (minCopies) {
                query.copies = { $gte: parseInt(minCopies) }; // Filter by available copies
            }

            // Fetch books based on the query
            const books = await Book.find(query);

            // Return the result
            res.status(200).json(books);
        } catch (error) {
            res.status(500);
            throw new Error('No book found');
        }
    })
);

//find a book

bookRouter.get(
  '/get/:id',
  asyncHandler(async (req, res) => {
    try {
      const book = await Book.findById(req.params.id);
      res.status(200);
      res.send(book);
    } catch (error) {
      res.status(500);
      throw new Error('No book found');
    }
  })
);

module.exports = { bookRouter };
