const express = require('express');
const { DoneFolder, DoneList, Member, Folder, List } = require('../../models/models');

const router = express.Router();

router.use((req, res, next) => {
  res.user = req.user;
  next();
});

router.get('/:memberid/', async (req, res) => {
  try {
    const MemberId = req.params.memberid;
    let results = await DoneFolder.findOne({
      where: { MemberId },
      attributes: ['count'],
    });
    const count = results.count;
    results = await DoneList.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      limit: 15,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const donelists = results.map(item => {
      return {
        id: item.id,
        title: item.title,
        author: item.author,
        img: item.img,
      }
    });
    // 닉네임
    const member = await Member.findOne({
      where: { id: MemberId },
      attributes: ['id', 'nick'],
    });
    res.json({
      donelists,
      count,
      member,
      user: res.user,
    });  
  } catch(err) {
    console.error(err);
  }
});
// 페이지
router.get('/page/:memberid/:page', async (req, res) => {
  try {
    const MemberId = req.params.memberid;
    const page = req.params.page;
    const offset = (page - 1) * 15;
    const items = await DoneList.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      limit: 15,
      offset,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const donelists = items.map(item => {
      return {
        id: item.id,
        img: item.img,
        title: item.title,
        author: item.author,
      }
    });
    res.json({ donelists });  
  } catch(err) {
    console.error(err);
  }
});

router.post('/delete', async (req, res) => {
    const ids = JSON.parse(req.body.id);
    const MemberId = req.body.MemberId;
    const page = req.body.page;
    const offset = 15 * (page - 1);
    // doneFolder의 count는 줄이고.
    await DoneFolder.decrement('count', {
      by: ids.length,
      where: { id: MemberId },
    })
    // DoneList에서 삭제하고
    await DoneList.destroy({
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      where: { id: ids },
    });
    const items = await DoneList.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      },],
      // 몇 개 내려보내야 하는지
      limit: 15,
      // 앞에서부터 몇번째의 리스트를 가져와야 하는지
      offset,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const newDone = items.map(item => {
      return {
        id: item.id,
        img: item.img,
        title: item.title,
        author: item.author,
      }
    });
    res.json({ newDone });  
})

router.post('/back', async (req, res) => {
  try {
    const ids = JSON.parse(req.body.id);
    const MemberId = req.body.MemberId;
    const page = req.body.page;
    const offset = 15 * (page - 1);
    let items = await DoneList.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      }, {
        model: Folder,
      }],
      where: { id: ids },
    });
    console.log(ids, items);
    // 원래 있던 곳에서 삭제
    await DoneList.destroy({
      include: [{
        model: Member,
        where: { id: MemberId },
      }],
      where: { id: ids },
    });
    // 만약 기존 폴더가 이미 사라지고 없다면?
    let folders = await Folder.findAll({
      attributes: ['id'],
    });
    folders = folders.map(item => item.id);
    console.log(folders);
    // 폴더가 있는 애들만 추가
    items = items.filter(item => {
      return item.Folder && folders.includes(item.Folder.id);
    });
    console.log(items);
    const moveLists = items.map(item => {
      return List.create({
        id: item.id,
        title: item.title,
        author: item.author,
        img: item.img,
        MemberId: item.Member.id,
        FolderId: item.Folder.id,
      });
    });
    console.log(moveLists);
    await Promise.all(moveLists);
    // doneFolder의 카운트는 줄이고.
    await DoneFolder.decrement('count', {
      by: ids.length,
      where: { id: MemberId },
    });
    // DoneList => List로 이동할때, 
    // 각각 폴더아이디별로 분류해 Folder의 카운트 올려야 한다.
    const FolderIds = [];
    items.forEach(item => {
      FolderIds[FolderIds.length] = item.Folder.id;
    });
    console.log(FolderIds);
    // 그래서 { 폴더ID: 몇개, 폴더ID: 몇개.. }이런 식으로
    const obj = {};
    FolderIds.forEach(id => {
      obj[id] = (obj[id] == undefined) ? 1 : (obj[id] + 1);
    });
    console.log(obj);
    // 바꿀 폴더 ID 배열
    const id = [];
    for(let prop in obj) {
      id[id.length] = prop;
    }
    console.log(id);
    // 기존의 폴더를 찾아가 늘리기
    const increments = id.map(async (folderId) => {
      await Folder.increment('count', {
        by: +obj[folderId],
        where: { id: folderId },
      });
    });
    await Promise.all(increments);
    items = await DoneList.findAll({
      include: [{
        model: Member,
        where: { id: MemberId },
      },],
      // 몇 개 내려보내야 하는지
      limit: 15,
      // 앞에서부터 몇번째의 리스트를 가져와야 하는지
      offset,
      attributes: ['id', 'title', 'author', 'img'],
    });
    const newDone = items.map(item => {
      return {
        id: item.id,
        img: item.img,
        title: item.title,
        author: item.author,
      }
    });
    console.log(newDone);
    res.json({ newDone });  
  } catch(err) {
    console.error(err);
  }
});

module.exports = router;