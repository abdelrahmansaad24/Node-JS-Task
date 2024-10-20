const jwt = require('jsonwebtoken');
//process.env.JWT_SECRET
const authTokenGenerator = userId => {
  return jwt.sign({ id: userId },process.env.JWT_SECRET , {
    expiresIn: '10d',
  });
};

module.exports = authTokenGenerator;
