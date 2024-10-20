const mongoose = require('mongoose');

const BorrowingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        borrowedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        start: {
            type: Date,
            required: true
        },
        end:{
            type: Date
        },
        returned: {
            type: Boolean,
            required: true,
        }
    },
);



const Borrowing = mongoose.model('Borrowing', BorrowingSchema);

module.exports = Borrowing;
