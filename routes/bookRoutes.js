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

//find a book
bookRouter.get(
  '/:id',
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
