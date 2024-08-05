const Sequelize = require('sequelize');
const { 
  Book, Member, Attend, Review,
  Folder, List, DoneFolder, DoneList, Sort,
  Quote, Favorite, TS, POP, KPOP, HFC, KFC, HMC, KMC } = require('./models');
const db = {};
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

// associate(db) 하는 애들은 1, 아니면 0
const models = [
  [{Book}, 1], [{Member}, 1], [{Attend}, 0], [{Review}, 1], 
  [{Folder}, 1], [{List}, 1], [{DoneFolder}, 0], [{DoneList}, 1], [{Sort}, 0],
  [{Quote}, 0], [{Favorite}, 0], [{TS}, 0], [{POP}, 0], [{KPOP}, 0], [{HFC}, 0], [{KFC}, 0], [{HMC}, 0], [{KMC}, 0],
];
db.sequelize = sequelize;

models.forEach(item => {
  const prop = Object.keys(item[0])[0];
  const obj = item[0][prop]; // 클래스
  db[prop] = obj;
  obj.init(sequelize);
});

models.forEach(item => {
  const obj = Object.values(item[0])[0];
  const associate = !!item[1]; // 불리언값
  if(associate) obj.associate(db); // 1인 경우에만
});

module.exports = db;
