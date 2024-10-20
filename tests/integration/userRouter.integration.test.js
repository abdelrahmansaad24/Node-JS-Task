const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server'); // Ensure this points to your main app file
const User = require('../../models/User');
const Borrowing = require('../../models/Borrowing');

describe('User Router Integration Tests', () => {
    let adminUser, regularUser;

    before(async () => {
        // Connect to the test database
        await mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(async () => {
        // Create test users before each test
        adminUser = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'StrongPassword123', admin: true });
        regularUser = await User.create({ name: 'Regular User', email: 'user@example.com', password: 'StrongPassword123', admin: false });
    });

    afterEach(async () => {
        // Clean up the database after each test
        await User.deleteMany({});
        await Borrowing.deleteMany({});
    });

    after(async () => {
        // Close the database connection
        await mongoose.connection.close();
    });

    describe('POST /api/users/register', () => {
        it('should register a new user', async () => {
            const newUser = { name: 'New User', email: 'newuser@example.com', password: 'StrongPassword123', admin: false };

            const response = await request(app)
                .post('/api/users/register')
                .send(newUser)
                .expect(201);

            expect(response.body).to.include(newUser);
            expect(response.body).to.have.property('token');
        });

        it('should return 400 for existing user', async () => {
            const existingUser = { name: 'Existing User', email: 'admin@example.com', password: 'StrongPassword123', admin: false };

            const response = await request(app)
                .post('/api/users/register')
                .send(existingUser)
                .expect(400);

            expect(response.body.message).to.equal('User Exist');
        });

        it('should return 400 for invalid email', async () => {
            const newUser = { name: 'New User', email: 'invalid-email', password: 'StrongPassword123', admin: false };

            const response = await request(app)
                .post('/api/users/register')
                .send(newUser)
                .expect(400);

            expect(response.body.message).to.equal('Invalid Email');
        });

        it('should return 400 for weak password', async () => {
            const newUser = { name: 'New User', email: 'newuser@example.com', password: 'weak', admin: false };

            const response = await request(app)
                .post('/api/users/register')
                .send(newUser)
                .expect(400);

            expect(response.body.message).to.equal('Invalid password');
        });
    });

    describe('POST /api/users/login', () => {
        it('should log in an existing user', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({ email: regularUser.email, password: 'StrongPassword123' })
                .expect(200);

            expect(response.body).to.have.property('token');
            expect(response.body).to.include({
                _id: regularUser._id.toString(),
                name: regularUser.name,
                email: regularUser.email,
            });
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({ email: regularUser.email, password: 'wrongPassword' })
                .expect(401);

            expect(response.body.message).to.equal('Invalid login credentials');
        });
    });

    describe('GET /api/users/profile', () => {
        it('should return user profile', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.include({
                _id: regularUser._id.toString(),
                name: regularUser.name,
                email: regularUser.email,
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .expect(401);

            expect(response.body.message).to.equal(`You don't have any profile yet`);
        });
    });

    describe('PUT /api/users/profile/update', () => {
        it('should update user profile', async () => {
            const updatedData = { name: 'Updated User', email: 'updateduser@example.com', password: 'UpdatedPassword123' };

            const response = await request(app)
                .put('/api/users/profile/update')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .send(updatedData)
                .expect(200);

            expect(response.body).to.include({
                name: updatedData.name,
                email: updatedData.email,
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            const updatedData = { name: 'Updated User' };

            const response = await request(app)
                .put('/api/users/profile/update')
                .send(updatedData)
                .expect(401);

            expect(response.body.message).to.equal('User Not found');
        });

        it('should return 400 for weak password', async () => {
            const updatedData = { password: 'weak' };

            const response = await request(app)
                .put('/api/users/profile/update')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .send(updatedData)
                .expect(400);

            expect(response.body.message).to.equal('Invalid password');
        });
    });

    describe('GET /api/users/history', () => {
        it('should return borrowing history for the user', async () => {
            // Create a borrowing record for the user
            const borrowing = await Borrowing.create({ bookId: 'sampleBookId', borrowedBy: regularUser._id, returned: false });

            const response = await request(app)
                .get('/api/users/history')
                .set('Authorization', `Bearer ${regularUser.generateAuthToken()}`)
                .expect(200);

            expect(response.body).to.be.an('array').that.includes.something.that.has.property('borrowedBy', regularUser._id.toString());
        });

        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app)
                .get('/api/users/history')
                .expect(401);

            expect(response.body.message).to.equal(`You don't have any profile yet`);
        });
    });
});
