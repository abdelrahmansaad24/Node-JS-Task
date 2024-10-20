
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URL;
const dbConnect = async () => {
    try {
        await mongoose.connect(uri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
        console.log('DB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = dbConnect;
