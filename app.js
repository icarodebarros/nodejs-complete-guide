const path = require('path');

const express = require('express');
const bodyParser = require('body-parser'); // Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
const mongoose = require('mongoose'); // is a MongoDB object modeling tool designed to work in an asynchronous environment.
const session = require('express-session'); // Session middleware. (Session data is not saved in the cookie itself, just the session ID. Session data is stored server-side).
const MongoDBStore = require('connect-mongodb-session')(session); // MongoDB-backed session storage for connect and Express.
const csrf = require('csurf'); // Node.js CSRF protection middleware.
const flash = require('connect-flash'); // simple flash impletentarion for express. (puts info on session temporarily).
const multer = require('multer'); // middleware for handling multipart/form-data, which is primarily used for uploading files.

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_USER}@cluster0.gafjw.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// app.use(bodyParser.json());// requests with header 'application/json'
app.use(bodyParser.urlencoded({ extended: false }));// requests with header 'x-www-form-urlencoded' (<form>)

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (on 'localhost:3000/')
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve static files (on 'localhost:3000/images')

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => { // Special middleware (4 params) to deal with erros
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session?.isLoggedIn
  });
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });
