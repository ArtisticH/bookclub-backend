const passport = require('passport');
const { Strategy: NaverStrategy } = require('passport-naver-v2');

const { Member } = require('../models/models');

module.exports = () => {
  passport.use(
     new NaverStrategy(
        {
           clientID: process.env.NAVER_ID,
           clientSecret: process.env.NAVER_SECRET,
           callbackURL: '/auth/naver/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
           try {
              const exUser = await Member.findOne({
                 where: { snsId: profile.id, provider: 'naver' },
              });
              if (exUser) {
                 done(null, exUser);
              } else {
                 const newUser = await Member.create({
                    email: profile.email,
                    nick: profile.nickname,
                    snsId: profile.id,
                    provider: 'naver',
                 });
                 done(null, newUser);
              }
           } catch (error) {
              done(error);
           }
        },
     ),
  );
};
