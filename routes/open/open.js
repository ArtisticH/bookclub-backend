const express = require("express");
const xml2js = require("xml2js");
const { Folder, List, Member } = require("../../models/models");

const router = express.Router();

router.use((req, res, next) => {
  res.user = req.user;
  next();
});

const parseXMLToJSON = (xml) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

function aladinDate(date) {
  const arr = date.split("-");
  return `${arr[0]}.${arr[1]}`;
}

const natLists = [];
const aladinLists = [];
const fakerLists = [];
let ALADIN = false;
let FAKER = false;
let NAT = false;

router.get("/search", (req, res) => {
  res.json({ user: res.user });
});

router.get("/:type", async (req, res) => {
  try {
    const type = req.params.type;
    let data;
    switch (type) {
      case "nat":
        data = await national();
        break;
      case "aladin":
        data = await aladin();
        break;
      case "faker":
        data = await faker();
        break;
    }
    data.user = res.user;
    res.json(data);
  } catch (e) {
    console.error(e);
  }
});

async function national() {
  const url = `https://nl.go.kr/NL/search/openApi/saseoApi.do?key=${process.env.NATIONAL_KEY}&startRowNumApi=1&endRowNumApi=100&start_date=20230101&end_date=20240630`;
  const response = await fetch(url);
  const xml = await response.text();
  // xml => JSON
  const data = await parseXMLToJSON(xml);
  const title = "2024 국립중앙도서관 사서추천도서";
  const img = "/img/open/national.png";
  const total = data.channel.list.length; // 총 갯수
  if (!NAT) {
    data.channel.list.forEach((list, index) => {
      natLists[natLists.length] = {
        id: index + 1,
        title: list.item.recomtitle,
        author: list.item.recomauthor,
        publisher: list.item.recompublisher,
        img: list.item.recomfilepath,
        date: `${list.item.publishYear}.${list.item.recomMonth}`,
        codeName: list.item.drCodeName,
      };
    });
  }
  NAT = true;
  // 12개만 보낼게
  const lists = natLists.slice(0, 12);
  const type = "nat";
  return { lists, title, img, type, total };
}

async function aladin() {
  const url = `http://www.aladin.co.kr/ttb/api/ItemList.aspx?ttbkey=${process.env.ALADIN_KEY}&QueryType=Bestseller&start=1&MaxResults=100&Output=JS&Version=20131101&SearchTarget=Book&CategoryId=1&Cover=Big`;
  const response = await fetch(url);
  const json = await response.json();
  const title = "알라딘 베스트셀러 리스트 - 소설/시/희곡";
  const img = "/img/open/aladin-list.png";
  const total = json.item.length;
  if (!ALADIN) {
    json.item.forEach((item, index) => {
      aladinLists[aladinLists.length] = {
        id: index + 1,
        title: item.title,
        author: item.author,
        publisher: item.publisher,
        img: item.cover,
        date: aladinDate(item.pubDate),
      };
    });
  }
  ALADIN = true;
  const lists = aladinLists.slice(0, 12);
  const type = "aladin";
  return { lists, title, img, total, type };
}

async function faker() {
  const url = "https://artistich.github.io/faker.books/faker.json";
  const response = await fetch(url);
  const json = await response.json();
  const title = "다독가 페이커의 독서목록";
  const img = `/img/open/faker-list.png`;
  const total = json.data.length;
  if (!FAKER) {
    json.data.forEach((item, index) => {
      // 페이지네이션할때 서버와 통신 없이 미리 받아논 애들을 쓸 수 있게 전부 저장
      fakerLists[fakerLists.length] = {
        id: index + 1,
        title: item.title,
        author: item.author,
        publisher: item.pub,
        img: item.img,
      };
    });
  }
  FAKER = true;
  const lists = fakerLists.slice(0, 12);
  const type = "faker";
  return { lists, title, img, total, type };
}
const match = {
  nat: natLists,
  aladin: aladinLists,
  faker: fakerLists,
};

// 페이지
router.post("/page", async (req, res) => {
  try {
    const page = req.body.page;
    const type = req.body.type;
    const start = (page - 1) * 12;
    const end = start + 12; // 마지막 미포함
    // 마지막은 미포함이라 항상 12개임
    const lists = match[type].slice(start, end);
    res.json({
      lists: JSON.stringify(lists),
    });
  } catch (err) {
    console.error(err);
  }
});
// 유저가 만든 폴더들 보여주기
router.get("/folders/:memberid", async (req, res) => {
  try {
    const MemberId = req.params.memberid;
    const results = await Folder.findAll({
      where: { MemberId },
      attributes: ["id", "title", "count"],
    });
    const folders = results.map((item) => {
      return {
        id: item.id,
        title: item.title,
        count: item.count,
      };
    });
    res.json({ folders });
  } catch (err) {
    console.error(err);
  }
});
// 기존 폴더에 추가
router.post("/exist", async (req, res) => {
  try {
    // 선택된 아이들을 특정 유저의 특정 폴더에 추가한다.
    const MemberId = req.body.MemberId;
    const FolderId = req.body.FolderId;
    const ids = JSON.parse(req.body.ids);
    const type = req.body.type;
    const lists = match[type].filter((item) => {
      return ids.includes(item.id);
    });
    // 우선 폴더의 갯수를 늘리고
    await Folder.increment("count", {
      by: ids.length,
      where: { id: FolderId },
    });
    // 리스트 폴더에 추가
    const create = lists.map(async (item) => {
      await List.create({
        FolderId,
        title: item.title,
        author: item.author,
        img: item.img,
        MemberId,
      });
    });
    await Promise.all(create);
    res.json({});
  } catch (err) {
    console.error(err);
  }
});
// 
router.post("/search/exist", async (req, res) => {
  try {
    // 선택된 아이들을 특정 유저의 특정 폴더에 추가한다.
    const MemberId = req.body.MemberId;
    const FolderId = req.body.FolderId;
    const list = JSON.parse(req.body.list);
    // 우선 폴더의 갯수를 늘리고
    await Folder.increment("count", {
      by: list.length,
      where: { id: FolderId },
    });
    await List.create({
      FolderId,
      title: list.title,
      author: list.author,
      img: list.img,
      MemberId,
    });
    res.json({});
  } catch (err) {
    console.error(err);
  }
});

// 새로운 폴더 추가
router.post("/add", async (req, res) => {
  try {
    const MemberId = req.body.MemberId;
    const title = req.body.title;
    const isPublic = req.body.isPublic === "public" ? true : false;
    const ids = JSON.parse(req.body.ids);
    const type = req.body.type;
    const lists = match[type].filter((item) => {
      return ids.includes(item.id);
    });
    const folder = await Folder.create({
      title,
      MemberId,
      public: isPublic,
      count: ids.length,
    });
    // 방금 추가한 폴더에 리스트들을 저장한다.
    const create = lists.map(async (item) => {
      await List.create({
        FolderId: folder.id,
        title: item.title,
        author: item.author,
        img: item.img,
        MemberId,
      });
    });
    await Promise.all(create);
    res.json({});
  } catch (err) {
    console.error(err);
  }
});
// 새로운 폴더 추가
router.post("/search/add", async (req, res) => {
  try {
    const MemberId = req.body.MemberId;
    const title = req.body.title;
    const isPublic = req.body.isPublic === "public" ? true : false;
    const list = JSON.parse(req.body.list);
    const folder = await Folder.create({
      title,
      MemberId,
      public: isPublic,
      count: 1,
    });
    await List.create({
      FolderId: folder.id,
      title: list.title,
      author: list.author,
      img: list.img,
      MemberId,
    });
    res.json({});
  } catch (err) {
    console.error(err);
  }
});

// 소장 자료 검색 결과 반환
router.post("/search", async (req, res) => {
  try {
    const option = req.body.option;
    const kwd = req.body.kwd;
    const url = `
    https://www.nl.go.kr/NL/search/openApi/search.do?key=${
      process.env.NATIONAL_KEY
    }&apiType=json&systemType=${encodeURIComponent(
      "오프라인자료"
    )}&category=${encodeURIComponent(
      "도서"
    )}&pageSize=10&pageNum=1&srchTarget=${encodeURIComponent(
      option
    )}&kwd=${encodeURIComponent(kwd)}
    `;
    const response = await fetch(url);
    const json = await response.json();
    const lists = json.result.map((item) => {
      return {
        title: item.titleInfo,
        author: item.authorInfo,
        pub: item.pubInfo,
        year: item.pubYearInfo,
        call: item.callNo,
        place: item.placeInfo,
        detail: `https://www.nl.go.kr${item.detailLink}`,
        img: item.imageUrl
          ? `http://cover.nl.go.kr/${item.imageUrl}`
          : "/img/open/national-list.png",
      };
    });
    res.json({ lists });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
