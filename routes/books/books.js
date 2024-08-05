const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Book, Member, Review } = require('../../models/models');
const { makeDate, makeStar, makeSum, makeText } = require('../tools/tools');

router.use((req, res, next) => {
  res.user = req.user;
  next();
});

router.get('/', async (req, res) => {
  const books = await Book.findAll({
    attributes: ['id', 'title', 'author'],
  });
  res.json(books);
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const book = await Book.findOne({ where: { id }});
    const totalBook = await Book.count();
    const member = await Member.findOne({ 
      where: { id: book.MemberId },
      attributes: ['id', 'nick'],
    });
    // 해당 책 평점 다 긁어오기
    const stars = await Review.findAll({
      include: [{
        model: Book,
        where: { id },
      }],
      attributes: ['stars'],
    });
    // 이 책에 대한 총 리뷰 갯수
    const totalReview = stars.length;
    // 평균 값을 구하고 소숫점 한 자리수로 나타내기
    const sum = makeSum(stars);
    // 위의 소수점숫자를 0, 0.5단위로 내리고, 그걸 배열로 만들기
    // 만약 3.8이면 3.5로 만들고 [full, full, full, half, empty]처럼
    const { starArr, starNum } = makeStar(sum);
    // 그리고 최신 리뷰 5개를 보내
    const results = await Review.findAll({
      include: [{
        model: Book,
        where: { id },
      }, {
        model: Member,
        attributes: ['id', 'type', 'nick'],
      }],
      order: [['id', 'DESC']], 
      limit: 5,
    });
    const reviews = results.map(review => {
      return {
        id: review.id,
        title: review.title,
        text: makeText(review.overText, review.text),
        like: review.like,
        overText: review.overText,
        stars: makeStar(review.stars).starArr,
        createdAt: makeDate(review.createdAt),
        updatedAt: makeDate(review.updatedAt),
        MemberId: review.Member.id,
        type: review.Member.type,
        nick: review.Member.nick,
      }
    });
    res.json({
      book, // 이 책
      totalBook, // 지금까지 책 갯수
      member, // 이 책 추천한 사람
      starNum, // 이 책에 대한 총 평점 숫자
      starArr, // 이 책에 대한 총 평점 배열
      reviews, // 리뷰5개
      totalReview, // 총 리뷰갯수
      user: res.user,
    });  
  } catch(err) {
    console.error(err);
  }
});

// 리뷰 새로 등록하고 전체 평점 업데이트하고 바로 등록한 리뷰 1개와 전체 평점 숫자와 배열 보내기
router.post('/', async (req, res) => {
  try {
    const BookId = req.body.BookId;
    const MemberId = req.body.MemberId;
    // 리뷰 등록
    await Review.create({
      title: req.body.title,
      text: req.body.text,
      overText: req.body.overText,
      stars: req.body.stars,
      BookId,
      MemberId,
    });
    // 등록 후 이 책에 관련된 모든 평점 업데이트
    const stars = await Review.findAll({
      include: [{
        model: Book,
        where: { id: BookId },
      }],
      attributes: ['stars'],
    });
    // 평점과 배열
    const sum = makeSum(stars);
    const { starArr, starNum } = makeStar(sum);
    // 그리고 최신 5개
    const results = await Review.findAll({
      include: [{
        model: Book,
        where: { id: BookId },
      }, {
        model: Member,
        attributes: ['id', 'type', 'nick'],
      }],
      order: [['id', 'DESC']], 
      limit: 5,
    });
    const reviews = results.map(review => {
      return {
        id: review.id,
        title: review.title,
        text: makeText(review.overText, review.text),
        like: review.like,
        overText: review.overText,
        stars: makeStar(review.stars).starArr,
        createdAt: makeDate(review.createdAt),
        updatedAt: makeDate(review.updatedAt),
        MemberId: review.Member.id,
        type: review.Member.type,
        nick: review.Member.nick,
      }
    });
    res.json({
      reviews,
      starArr,
      starNum,
    });  
  } catch(err) {
    console.error(err);
  }
});

// 좋아요
router.post('/like', async (req, res) => {
  try {
    const ReviewId = req.body.ReviewId;
    const MemberId = req.body.MemberId
    // 먼저 해당 리뷰 글에 유저가 하트를 클릭한 적 있는지 검사
    let result = await db.sequelize.models.ReviewLike.findOne({
      where: {
        ReviewId,
        MemberId,  
      }
    });
    // 클릭한적있다면(결과가있다면) clickable = false이고 클릭한적없다면 clickable = true
    const clickable = result ? false : true;
    if(clickable) {
      // 클릭 반영해줄게. 
      // ReviewLike에 관계 추가
      await db.sequelize.models.ReviewLike.create({
        ReviewId,
        MemberId,
      });
      // like값 1 증가
      await Review.increment('like', {
        by: 1,
        where: { id: ReviewId }
      });
    } else {
      // 클릭 다시 취소해줄게
      await db.sequelize.models.ReviewLike.destroy({
        where: {
          ReviewId,
          MemberId, 
        },
      });  
      await Review.decrement('like', {
        by: 1,
        where: { id: ReviewId },
      });
    }  
    // 업데이트된 라이크 
    result = await Review.findOne({
      where: { id: ReviewId },
      attributes: ['like'],
    });
    const like = result.like;
    res.json({ clickable, like });  
  } catch(err) {
    console.err(err);
  }
});

// 수정
router.patch('/', async (req, res) => {
  try {
    const id = req.body.id;
    const bookId = req.body.BookId;
    await Review.update({
      title: req.body.title,
      text: req.body.text,
      overText: req.body.overText,
      stars: req.body.stars,
    }, {
      where: { id },
      include: [{
        model: Book,
        where: { id: bookId },
      }],
    });
    const stars = await Review.findAll({
      include: [{
        model: Book,
        where: { id: bookId },
      }],
      attributes: ['stars'],
    });
    const sum = makeSum(stars);
    const { starArr, starNum } = makeStar(sum);
    // 업데이트된 친구
    const result = await Review.findOne({
      include: [{
        model: Book,
        where: { id: bookId },
      }, {
        model: Member,
        attributes: ['id', 'type', 'nick'],
      }],
      where: { id },
    });
    const review = {
      id: result.id,
      title: result.title,
      like: result.like,
      text: makeText(result.overText, result.text),
      overText: result.overText,
      createdAt: makeDate(result.createdAt),
      updatedAt: makeDate(result.updatedAt),
      stars: makeStar(result.stars).starArr,
      MemberId: result.Member.id,
      type: result.Member.type,
      nick: result.Member.nick,
    };
    res.json({
      review,
      starArr,
      starNum,
    });  
  } catch(err) {
    console.error(err);
  }
});
// 삭제
router.delete('/:reviewid/:bookid/:page', async (req, res) => {
  try {
    const id = req.params.reviewid;
    const bookId = req.params.bookid;
    const page = req.params.page;
    await Review.destroy({
      where: { id },
      include: [{
        model: Book,
        where: { id: bookId },
      }],
    });
    const stars = await Review.findAll({
      include: [{
        model: Book,
        where: { id: bookId },
      }],
      attributes: ['stars'],
    });
    const sum = makeSum(stars);
    const { starArr, starNum } = makeStar(sum);
    const offset = 5 * (page - 1);
    const results = await Review.findAll({
      include: [{
        model: Book,
        where: { id: bookId },
      }, {
        model: Member,
        attributes: ['id', 'type', 'nick'],
      }],
      offset,
      limit: 5,
      order: [['id', 'DESC']], // 내림차순
    });
    const newReviews =  results.map(item => {
      return {
        id: item.id,
        title: item.title,
        text: makeText(item.overText, item.text),
        like: item.like,
        overText: item.overText,
        stars: makeStar(item.stars).starArr,
        createdAt: makeDate(item.createdAt),
        updatedAt: makeDate(item.updatedAt),
        MemberId: item.MemberId,
        type: item.Member.type,
        nick: item.Member.nick,  
      }
    });
    res.json({
      newReviews,
      starArr,
      starNum,
    });  
  } catch(err) {
    console.error(err);
  }
});
// 페이지 버튼 클릭 시
router.get('/page/:bookid/:page', async (req, res) => {
  try {
    const bookId = req.params.bookid;
    const page = req.params.page;
    // 만약 페이지 4를 클릭하면 15개를 건너뛰고 그 다음 5개를 가져와야 한다. 
    const offset = 5 * (page - 1);
    const results = await Review.findAll({
      include: [{
        model: Book,
        where: { id: bookId },
      }, {
        model: Member,
        attributes: ['id', 'type', 'nick'],
      }],
      offset,
      limit: 5,
      order: [['id', 'DESC']], // 내림차순
    });
    const reviews =  results.map(item => {
      return {
        id: item.id,
        title: item.title,
        text: makeText(item.overText, item.text),
        like: item.like,
        overText: item.overText,
        stars: makeStar(item.stars).starArr,
        createdAt: makeDate(item.createdAt),
        updatedAt: makeDate(item.updatedAt),
        MemberId: item.MemberId,
        type: item.Member.type,
        nick: item.Member.nick,  
      }
    });
    res.json({ reviews });  
  } catch(err) {
    console.error(err);
  }
});


module.exports = router;

