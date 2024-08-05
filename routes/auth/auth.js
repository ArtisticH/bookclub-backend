const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { Member } = require('../../models/models');
const kakaoStrategy = require('../../passport/kakaoStrategy');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, nick, password } = req.body;
  try {
    if(!email || !nick || !password) {
      return res.json({ success: false, message: '빈 칸을 모두 채워주세요.'});
    }
    const exUser = await Member.findOne({ where: { email }});
    if(exUser) {
      return res.json({ success: false, message: '이미 존재하는 회원입니다.'});
    }
    const hash = await bcrypt.hash(password, 12);
    await Member.create({
      email,
      nick,
      password: hash,
    });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  if(!email || !password) {
    return res.redirect({ success: false, message: '이메일과 비밀번호 모두 작성해주세요.' });
  }
  passport.authenticate('local', (authError, user, info) => {
    if(authError) {
      return next(authError);
    }
    if(!user) {
      return res.json({ success: false, message: info.message }); 
    }
    return req.login(user, (loginError) => {
      if(loginError) {
        return next(loginError);
      }
      return res.json({ user, success: true });
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy();
    return res.json({ success: true });
  });
});

router.get('/kakao',  passport.authenticate('kakao'));
router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), async (req, res) => {
  const members = await Member.findAll({
    where: { type: 'MEMBER' },
    attributes: ['id', 'nick'],
  });
  const user = encodeURIComponent(JSON.stringify(req.user));
  const membersData = encodeURIComponent(JSON.stringify(members));
  res.redirect(`http://localhost:3000/?auth=kakao&user=${user}&members=${membersData}`);
});

router.get('/naver',  passport.authenticate('naver', { authType: 'reprompt' }));
router.get('/naver/callback', passport.authenticate('naver', {
  failureRedirect: '/',
}), async (req, res) => {
  const members = await Member.findAll({
    where: { type: 'MEMBER' },
    attributes: ['id', 'nick'],
  });
  const user = encodeURIComponent(JSON.stringify(req.user));
  const membersData = encodeURIComponent(JSON.stringify(members));
  res.redirect(`http://localhost:3000/?auth=naver&user=${user}&members=${membersData}`);

});

module.exports = router;