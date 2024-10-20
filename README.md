### Task Description:
  Develop a backend service to manage a library management system. The service should handle the creation, retrieval, update, and deletion (CRUD) of books, users, and their borrowing history.
# The application should allow users to:
  Create an account and log in.
  View available books in the library.
  Borrow and return books.
  View their borrowing history
### Task Requirements
  # User Authentication and Authorization:
    Implement user registration and login functionalities.
    Use JWT (JSON Web Token) for securing the endpoints.
    Admins should have elevated privileges to manage the library resources.
  ## API Endpoints
  # user:
    POST /api/register: Register a new user.
    POST /api/login: Log in a user.
  # Books
    GET /api/books: Retrieve a list of available books.
    POST /api/books: Add a new book (admin only).
    PUT /api/books/:id: Update book details (admin only).
    DELETE /api/books/:id: Delete a book by ID (admin only).
  # Borrowing
    POST /api/borrow: Borrow a book.
    POST /api/return: Return a borrowed book.
    GET /api/borrow/history: Retrieve the borrowing history for the logged-in user.
  # Reports (Admin)
    GET /api/reports/borrowed: Get a report of currently borrowed books.
    GET /api/reports/popular: Get a report of the most popular books.
  # Database
    Use a relational database (e.g., MySQL, PostgreSQL) or a NoSQL da
    tabase (e.g., MongoDB) to store user, book, and borrowing data.
    Ensure proper indexing and relationships (if using a relational database).
    Data Validation and Error Handling
    Implement thorough data validation for all input.
    Provide meaningful error messages and handle errors gracefully.
  # Documentation
    Document your API endpoints using a tool like Swagger or Postman.
  # Testing
    Write unit and integration tests for your API endpoints.  
  # Deployment
    Deploy your application to a cloud service (e.g., Heroku, AWS, Vercel).
  # Optional Features
    Search and Filtering
    Implement search and filtering options for available books.✅
### Bonus 
  Implement Dockerization for the entire project.
  Create Dockerfiles for your application.
  Set up Docker Compose for multi-container applications.
  Ensure your application can be easily started with a single command (docker-compose up).✅

  ## Deployment link: https://nodejs-opal-pi.vercel.app/
  ## Documentation link : https://documenter.getpostman.com/view/24782304/2sAXxWbAG7
