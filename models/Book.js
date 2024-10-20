const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
  {
      category: {
          type: String,
          required: true,
      },
      author: {
          type: String,
          required: true,
      },
      title: {
          type: String,
      },
      copies: {
          type: Number,
          require: true,
      },
  },
  { timestamps: true }
);

const Book = mongoose.model('Book', BookSchema);

module.exports = Book;
