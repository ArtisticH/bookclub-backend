const express = require('express');
const { Folder, List, DoneFolder, DoneList, Member } = require('../../models/models');
const { Op } = require('sequelize');
const { upload, none } = require('../tools/multer');

const router = express.Router();

router.use((req, res, next) => {
  res.user = req.user;
  next();
});
router.get('/:folderid/:memberid', async (req, res) => {
  try {
    const MemberId = req.params.memberid;
    const FolderId = req.params.folderid;
    let results = await Folder.findOne({
      include: [{
        model: Member,
        where: { id: MemberId },
        attributes: ['id', 'nick']
      }],
      where: { id: FolderId },
      attributes: ['count', 'title'],
    });
    const member = results.Member;
    // 카운트
    const count = results.count;
    const title = results.title;
    // 해당 유저의 다른 폴더들, 근데 현재 폴더는 제외해야 함.
    // 폴더 이동 폼 클릭 시 보여지는 화면
    results = await Folder.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      where: { id: { [Op.not]: FolderId }},
      attributes: ['id', 'title', 'count'],
    });
    const others = results.map(item => {
      return {
        id: item.id,
        title: item.title,
        count: item.count,
      }
    });
    // 15개만
    results = await List.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      limit: 15,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const lists = results.map(item => {
      return {
        id: item.id,
        title: item.title,
        author: item.author,
        img: item.img,
      }
    });
    res.json({
      member,
      lists,
      title,
      others,
      count,
      FolderId, 
      user: res.user,
    });  
  } catch(err) {
    console.error(err);
  }
});
// 이미지 미리보기
router.post('/preview', upload.single('image'), (req, res) => {
  try {
    const url = `/img/${req.file.filename}`;
    res.json({ url });  
  } catch(err) {
    console.error(err);
  }
});
// 리스트 추가할때
router.post('/', none.none(), async(req, res) => {
  try {
    const img = req.body.img;
    const title = req.body.title;
    const author = req.body.author;
    const MemberId = req.body.MemberId;
    const FolderId = req.body.FolderId;
    // 리스트 새롭게 저장
    await List.create({
      img,
      title,
      author,
      MemberId,
      FolderId,
    });
    // 폴더에서 count추가
    await Folder.increment('count', {
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      by: 1,
      where: { id: FolderId },
    });
    results = await List.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      limit: 15,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const lists = results.map(item => {
      return {
        id: item.id,
        title: item.title,
        author: item.author,
        img: item.img,
      }
    });
    res.json({ lists });  
  } catch(err) {
    console.error(err);
  }
});
// 리스트 삭제할때
router.post('/delete', async(req, res) => {
  try {
    const FolderId = req.body.FolderId;
    const MemberId = req.body.MemberId;
    const page = req.body.page; 
    const offset = 15 * (page - 1);
    const ids = JSON.parse(req.body.id);
    // 삭제하고
    await List.destroy({
      where: { id: ids },
    });
    // 줄이고
    await Folder.decrement('count', {
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      by: ids.length,
      where: { id: FolderId },
    });
    const results = await List.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      limit: 15,
      offset,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const newLists = results.map(item => {
      return {
        id: item.id,
        img: item.img,
        title: item.title,
        author: item.author,
      }
    });
    res.json({ newLists });  
  } catch(err) {
    console.error(err);
  }
});
// 폴더 이동할떄
router.post('/move', async(req, res) => {
  try {
    const MemberId = req.body.MemberId;
    const FolderId = req.body.FolderId;
    const targetId = req.body.targetId;
    const page = req.body.page;
    const offset = 15 * (page - 1);
    const ids = JSON.parse(req.body.id);
    // 먼저 이동할 아이들을 혹시 몰라 다시 한번 데이터베이스에서 가져오고
    let items = await List.findAll({
      include: [{
        model: Folder,
        where: { id: FolderId },
      }, {
        model: Member,
        where: { id: MemberId },
      }],
      where: { id: ids },
    });
    const selected = items.map(item => item.id);
    // 폴더 아이디 바꿔주기
    await List.update({
      FolderId: targetId,
    }, {
      where: { id: selected },
    });
    // 현재 폴더에서 빠져나간 만큼 빼주기
    await Folder.decrement('count', {
      by: ids.length,
      where: { id: FolderId },
    })
    // 이사간 애들만큼 더해주기
    await Folder.increment('count', {
      by: ids.length,
      where: { id: targetId },
    });
    // 그리고 카운트 업데이트된거
    items = await Folder.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      where: { id: { [Op.not]: FolderId }},
      attributes: ['id', 'title', 'count'],
    });
    const others = items.map(item => {
      return {
        id: item.id,
        title: item.title,
        count: item.count,
      }
    });
    items = await List.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      // 몇 개 내려보내야 하는지
      limit: 15,
      // 앞에서부터 몇번째의 리스트를 가져와야 하는지
      offset,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const newLists = items.map(item => {
      return {
        id: item.id,
        img: item.img,
        title: item.title,
        author: item.author,
      }
    });
    res.json({ others, newLists });  
  } catch(err) {
    console.error(err);
  }
});
// 완독버튼
router.post('/read', async (req, res) => {
  try {
    const ids = JSON.parse(req.body.id);
    const FolderId = req.body.FolderId;
    const MemberId = req.body.MemberId;
    const page = req.body.page;
    const offset = 15 * (page - 1);
    // List에서 DoneList로 옮기기
    let items = await List.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      where: { id: ids },
    });
    const moveLists = items.map(item => {
      return DoneList.create({
        id: item.id,
        title: item.title,
        author: item.author,
        img: item.img,
        MemberId: item.Member.id,
        FolderId: item.Folder.id,
      });
    });
    await Promise.all(moveLists);
    // 원래 있던 곳에서 삭제
    await List.destroy({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      where: { id: ids },
    });
    // 현재 담고 있는 폴더의 카운트 줄이고, 
    await Folder.decrement('count', {
      include: [{
        model: Member,
        where: { id : MemberId },
      }],
      by: ids.length,
      where: { id: FolderId },
    })
    // doneFolder의 카운트는 늘린다.
    await DoneFolder.increment('count', {
      by: ids.length,
      where: { id: MemberId },
    });
    items = await List.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      limit: 15,
      offset,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const newLists = items.map(item => {
      return {
        id: item.id,
        img: item.img,
        title: item.title,
        author: item.author,
      }
    });
    res.json({ newLists });  
  } catch(err) {
    console.error(err);
  }
});
// 페이지네이션
router.get('/page/:folderid/:memberid/:page', async (req, res) => {
  try {
    const FolderId = req.params.folderid;
    const MemberId = req.params.memberid;
    const page = req.params.page;
    const offset = (page - 1) * 15;
    const items = await List.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
        where: { id: FolderId },
      }],
      limit: 15,
      offset,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const lists = items.map(item => {
      return {
        id: item.id,
        img: item.img,
        title: item.title,
        author: item.author,
      }
    });
    res.json({ lists });  
  } catch(err) {
    console.error(err);
  }
});

module.exports = router;