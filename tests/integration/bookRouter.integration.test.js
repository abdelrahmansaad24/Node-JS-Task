const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server'); // Ensure this points to your main app file
const User = require('../../models/User');
const Book = require('../../models/Book');
const Borrowing = require('../../models/Borrowing');

describe('Book Router Integration Tests', () => {
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

    describe('POST /api/books', () => {
        it('should create a book for admin users', async () => {
            const newBook = { title: 'New Book', author: 'New Author', copies: 3 };

            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`)
                .send(newBook)
                .expect(201);

            expect(response.body).to.include(newBook);
        });

        it('should return 401 for non-admin users', async () => {
            const newBook = { title: 'New Book', author: 'New Author', copies: 3 };

            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .send(newBook)
                .expect(401);

            expect(response.body.message).to.equal('Invalid adding credentials');
        });
    });

    describe('GET /api/books', () => {
        it('should return all books for admin users', async () => {
            const response = await request(app)
                .get('/api/books')
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.be.an('array').that.includes.something.that.has.property('title', book.title);
        });

        it('should return 401 for non-admin users', async () => {
            const response = await request(app)
                .get('/api/books')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .expect(401);

            expect(response.body.message).to.equal('Invalid credentials');
        });
    });

    describe('DELETE /api/books/:id', () => {
        it('should delete a book for admin users', async () => {
            const response = await request(app)
                .delete(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`)
                .expect(204);
        });

        it('should return 401 for non-admin users', async () => {
            const response = await request(app)
                .delete(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .expect(401);

            expect(response.body.message).to.equal('Invalid credentials');
        });

        it('should return 404 if book does not exist', async () => {
            const response = await request(app)
                .delete(`/api/books/invalidId`)
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`)
                .expect(404);
        });
    });

    describe('PUT /api/books/:id', () => {
        it('should update a book for admin users', async () => {
            const updatedBook = { title: 'Updated Title', author: 'Updated Author' };

            const response = await request(app)
                .put(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${adminUser.generateAuthToken()}`)
                .send(updatedBook)
                .expect(200);

            expect(response.body).to.include(updatedBook);
        });

        it('should return 401 for non-admin users', async () => {
            const updatedBook = { title: 'Updated Title', author: 'Updated Author' };

            const response = await request(app)
                .put(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .send(updatedBook)
                .expect(401);

            expect(response.body.message).to.equal('Invalid credentials');
        });
    });

    describe('GET /api/books/:id', () => {
        it('should find a book by id', async () => {
            const response = await request(app)
                .get(`/api/books/${book._id}`)
                .expect(200);

            expect(response.body).to.have.property('title', book.title);
        });

        it('should return 404 if book does not exist', async () => {
            const response = await request(app)
                .get(`/api/books/invalidId`)
                .expect(404);

            expect(response.body.message).to.equal('No book found');
        });
    });
});
