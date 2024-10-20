const express = require('express');
const asyncHandler = require('express-async-handler');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/User');
const authTokenGenerator = require('../utils/authTokenGenerator');
const userRouter = express.Router();
const validator = require('validator');
const Book = require("../models/Book");
const Borrowing = require("../models/Borrowing");

//Create user
userRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, admin } = req.body;
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      throw new Error('User Exist');
    }
    if (!validator.isEmail(email)){
        throw new Error('Invalid Email');
    }
    if (!validator.isStrongPassword(password)){
        throw new Error('Invalid password');
    }
    const user = await User.create({ name, email, password, admin });
    if (user) {
      res.status(201);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        password: user.password,
        token: authTokenGenerator(user._id),
      });
    }
  })
);

userRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    //Compare password
    if (user && (await user.isPasswordMatch(password))) {
      //res.status(201);
      res.status(200);
      res.json({
        _id: user._id,
        name: user.name,
        password: user.password,
        email: user.email,
        token: authTokenGenerator(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid login credentials');
    }
  })
);

//GET PROFILE

userRouter.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
          res.status(401);
          throw new Error(`You don't have any profile yet`);
      }
      res.status(201);
      res.send(user);
    } catch (error) {
      res.status(500);
      throw new Error('Server error');
    }
  })
);

//UPDATE PROFILE

userRouter.put(
  '/profile/update',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      //This will encrypt automatically in our model
      if (req.body.password) {
          if(validator.isStrongPassword(req.body.password)) {
              user.password = req.body.password || user.password;
          }else {
              throw new Error('Invalid password');
          }
      }
      const updateUser = await user.save();
      res.json({
        _id: updateUser._id,
        name: updateUser.name,
        password: updateUser.password,
        email: updateUser.email,
        token: authTokenGenerator(updateUser._id),
      });
    } else {
      res.status(401);
      throw new Error('User Not found');
    }
  })
);


//get history

userRouter.get(
    '/history',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id);
        if (user){
            const result = await Borrowing.find({borroedBy: user._id});
            res.status(200);
            res.json(result);
        }else {
            res.status(401);
            throw new Error(`You don't have any profile yet`);
        }
        }
    )
)


module.exports = { userRouter };
