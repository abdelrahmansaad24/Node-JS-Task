require('dotenv').config();
const path = require('path');
const express = require('express');
const routes = require('./routes/userRoutes');
const error = require('./middlewares/errorMiddleware');
const bookRouter = require('./routes/bookRoutes');
const reportRouter = require("./routes/reportRouter");
const borrowingRouter = require("./routes/borrowingRoutes");
require('./config/DBConnect')();
const app = express();

//Routes
app.use(express.json());

app.use('/api/users', routes.userRouter);
app.use('/api/books', bookRouter.bookRouter);
app.use('/api/reports', reportRouter.reportRouter)
app.use('/api', borrowingRouter.borrowingRouter)
// //Deployment
// const directory = path.resolve();
// app.use(express.static(path.join(directory, '/frontend/build')));
// app.get('*', (req, res) =>
//   res.sendFile(path.resolve(directory, 'frontend', 'build', 'index.html'))
// );
const __dirname2 = path.resolve();
app.use('/uploads', express.static(path.join(__dirname2, '/uploads')));

app.get('/', (req, res) => {
    res.send('API is running....');
});
//====Catch Error
app.use(error.notfoundErrorMiddleware);
app.use(error.errorMiddlewareHandler);

//End of deployment
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
