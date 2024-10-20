const mongoose = require('mongoose'); // Import the Mongoose library to interact with MongoDB

// Get the MongoDB URI from the environment variables
const uri = process.env.MONGODB_URL;

// Function to connect to the MongoDB database
const dbConnect = async () => {
    try {
        // Connect to MongoDB using the URI and connection options
        await mongoose.connect(uri, {
            useUnifiedTopology: true, // Use the new connection management engine
            useNewUrlParser: true,    // Use the new URL string parser
        });
        console.log('DB connected'); // Log success message if connection is successful
    } catch (error) {
        console.error('Error connecting to MongoDB:', error); // Log error message if connection fails
        process.exit(1); // Exit the process with failure code if connection fails
    }
};

// Export the dbConnect function to use it in other parts of the application
module.exports = dbConnect;
