const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server'); // Ensure this points to your main app file
const User = require('../../models/User');
const Book = require('../../models/Book');
const Borrowing = require('../../models/Borrowing');

describe('Report Router Integration Tests', () => {
    let adminUser, regularUser, book;

    before(async () => {
        // Connect to the test database
        await mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(async () => {
        // Create test users and a test book before each test
        adminUser = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'password123', admin: true });
        regularUser = await User.create({ name: 'Regular User', email: 'user@example.com', password: 'password123', admin: false });
        book = await Book.create({ title: 'Test Book', author: 'Author Name', copies: 5 });
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

    describe('GET /api/reports/borrowed', () => {
        it('should return currently borrowed books for admin users', async () => {
            // Borrow the book
            const borrowResponse = await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`); // Assuming you have a method to generate a token

            const response = await request(app)
                .get('/api/reports/borrowed')
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.be.an('array').that.is.not.empty;
            expect(response.body[0]).to.have.property('title', book.title);
        });

        it('should return 401 for non-admin users', async () => {
            // Attempt to access borrowed books with a regular user
            const response = await request(app)
                .get('/api/reports/borrowed')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .expect(401);
            expect(response.body.message).to.equal(`You don't have any profile yet`);
        });
    });

    describe('GET /api/reports/popular/:n', () => {
        it('should return the most popular n books for admin users', async () => {
            // Borrow the book multiple times
            await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`);
            await request(app)
                .post(`/api/borrow/${book._id}`)
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`);

            const response = await request(app)
                .get('/api/reports/popular/1')
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.be.an('array').that.is.not.empty;
            expect(response.body[0]).to.have.property('bookId', book._id.toString());
        });

        it('should return 401 for non-admin users', async () => {
            const response = await request(app)
                .get('/api/reports/popular/1')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .expect(401);
            expect(response.body.message).to.equal(`unauthorized access`);
        });
    });
});
