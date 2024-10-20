const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server'); // Ensure this points to your main app file
const User = require('../../models/User');
const Book = require('../../models/Book');
const Borrowing = require('../../models/Borrowing');

describe('Borrowing Router Integration Tests', () => {
    let user, book;

    before(async () => {
        // Connect to the test database
        await mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(async () => {
        // Create a test user and book before each test
        user = await User.create({ name: 'John Doe', email: 'john@example.com', password: 'password123' });
        book = await Book.create({ title: 'Test Book', author: 'Author Name', copies: 2 });
    });

    afterEach(async () => {
        // Clean up the database after each test
        await User.deleteMany({});
        await Book.deleteMany({});
        await Borrowing.deleteMany({});
    });

    after(async () => {
        // Close the database connection
        await mongoose.connection.close();
    });

    describe('POST /api/borrow/:id', () => {
        it('should allow a user to borrow a book', async () => {
            const response = await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`) // Assuming you have a method to generate a token
                .expect(201);

            expect(response.body).to.have.property('_id');
            expect(response.body).to.have.property('title', book.title);
            expect(response.body).to.have.property('returned', false);
        });

        it('should return 404 if book not found', async () => {
            const response = await request(app)
                .post(`/api/borrow/invalidBookId`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`)
                .expect(404);
            expect(response.body.message).to.equal('book not found');
        });

        it('should return 404 if no copies available', async () => {
            // Borrow the book once to exhaust the copies
            await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`);

            const response = await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`)
                .expect(404);
            expect(response.body.message).to.equal('No enouph copies');
        });
    });

    describe('POST /api/return/:id', () => {
        it('should allow a user to return a borrowed book', async () => {
            // First, borrow the book
            const borrowResponse = await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`);

            const response = await request(app)
                .post(`/api/return/${borrowResponse.body._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.have.property('returned', true);
        });

        it('should return 404 if borrow record not found', async () => {
            const response = await request(app)
                .post(`/api/return/invalidBorrowId`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`)
                .expect(404);
            expect(response.body.message).to.equal('book not found');
        });
    });

    describe('GET /api/borrowed', () => {
        it('should return the active borrowings for the user', async () => {
            // First, borrow a book
            await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`);

            const response = await request(app)
                .get('/api/borrowed')
                .set('Authorization', `Bearer ${user.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.be.an('array').that.is.not.empty;
            expect(response.body[0]).to.have.property('borrowedBy', user._id.toString());
        });
    });

    describe('GET /api/popular/:n', () => {
        it('should return the most popular n books', async () => {
            // Borrow the book multiple times
            await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`);

            await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${user.generateAuthToken()}`);

            const response = await request(app)
                .get('/api/popular/1')
                .set('Authorization', `Bearer ${user.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.be.an('array').that.is.not.empty;
            expect(response.body[0]).to.have.property('bookId', book._id.toString());
        });

        it('should return 401 for non-admin users', async () => {
            const response = await request(app)
                .get('/api/popular/1')
                .set('Authorization', `Bearer ${user.generateAuthToken()}`)
                .expect(401);
            expect(response.body.message).to.equal('unauthorized access');
        });
    });
});
