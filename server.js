const express = require('express');
const cooikeParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
});

redisClient.connect().catch(console.error);
const homeRouter = require('./routes/home');
const authRouter = require('./routes/auth/auth');
const booksRouter = require('./routes/books/books');
const memberRouter = require('./routes/members');
const wishlistRouter = require('./routes/wishlist/wishlist');
const listRouter = require('./routes/wishlist/list');
const donelistRouter = require('./routes/wishlist/donelist');
const favoriteRouter = require('./routes/favorite/favorite');
const decoRouter = require('./routes/deco/deco');
const openRouter = require('./routes/open/open');
// 시퀄라이즈객체
const { sequelize } = require('./models'); 
const passportConfig = require('./passport');

const app = express();
passportConfig();
app.set('port', 3001);

sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch(err => {
    console.error(err);
  });

if(process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cooikeParser(process.env.COOKIE_SECRET));
const sessionOption = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    expires: new Date(Date.now() + 7200000),
    httpOnly: true,
    secure: false,
  },
  store: new RedisStore({ client: redisClient }),
  name: 'BOOKCLUB',
};
app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: [
      "https://port-0-bookclub-backend-lzgqjytn6cca1780.sel4.cloudtype.app",
      "https://web-bookclub-frontend-lzgqjytn6cca1780.sel4.cloudtype.app",
      "http://localhost:3000",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })
);
app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/books', booksRouter);
app.use('/members', memberRouter);
app.use('/wishlist', wishlistRouter);
app.use('/list', listRouter);
app.use('/donelist', donelistRouter);
app.use('/favorite', favoriteRouter);
app.use('/deco', decoRouter);
app.use('/open', openRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error/error');
});

app.listen(app.get('port'), () => {
  console.log(`${app.get('port')}에서 실행 중...`);
})
