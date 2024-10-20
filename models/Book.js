const mongoose = require('mongoose'); // Import the Mongoose library to work with MongoDB

// Define the schema for a Book document
const BookSchema = new mongoose.Schema(
  {
      category: {
          type: String, // The category or genre of the book (e.g., Fiction, Non-fiction)
          required: true, // This field is required
      },
      author: {
          type: String, // The author of the book
          required: true, // This field is required
      },
      title: {
          type: String, // The title of the book
          // Not required, can be optional
      },
      copies: {
          type: Number, // The number of copies of the book available
          require: true, // This field is required (should be 'required' instead of 'require')
      },
  },
  { timestamps: true } // Automatically adds 'createdAt' and 'updatedAt' fields
);

// Create a model called 'Book' based on the BookSchema
const Book = mongoose.model('Book', BookSchema);

// Export the model to use it in other parts of the application
module.exports = Book;
