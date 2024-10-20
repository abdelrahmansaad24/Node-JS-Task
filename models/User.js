const mongoose = require('mongoose'); // Import Mongoose to work with MongoDB
const bcrypt = require('bcryptjs'); // Import bcryptjs to handle password hashing

// Define the schema for a User document
const UserSchema = new mongoose.Schema({
  name: {
    type: String, // The user's name
    required: true, // This field is required
  },
  email: {
    type: String, // The user's email
    required: true, // This field is required
  },
  password: {
    type: String, // The user's password (hashed before saving)
    // Not required for creating user accounts, but should be set for password-based logins
  },
  admin: {
    type: Boolean, // Flag to indicate if the user has admin privileges
    default: false, // By default, users are not admins
  }
});

// Middleware to hash the password before saving the user to the database
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified or if it's a new user
  if (!this.isModified('password')) {
    next(); // Skip hashing if the password hasn't been modified
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10); // Generate salt with 10 rounds (more rounds = stronger security)
  this.password = await bcrypt.hash(this.password, salt); // Hash the password and store it in the document

  next(); // Continue to the next middleware or save the document
});

// Method to verify the password during login
// `isPasswordMatch` can be called on a user instance to compare the entered password with the stored hashed password
UserSchema.methods.isPasswordMatch = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Compare entered password with the hashed one
};

// Create the User model based on the UserSchema
const User = mongoose.model('User', UserSchema);

// Export the model to use it in other parts of the application
module.exports = User;
