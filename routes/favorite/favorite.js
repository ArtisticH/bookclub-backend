const express = require("express");
const {
  Favorite,
  TS,
  POP,
  KPOP,
  HFC,
  KFC,
  HMC,
  KMC,
} = require("../../models/models");
const { sequelize } = require("../../models");

const match = {
  TS: TS,
  POP: POP,
  KPOP: KPOP,
  KFC: KFC,
  HFC: HFC,
  HMC: HMC,
  KMC: KMC,
};

const router = express.Router();

router.get("/", async (req, res) => {
  const favorites = await Favorite.findAll({});
  res.json(favorites);
});
// 랭킹
router.get("/ranking/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const item = await Favorite.findOne({
      where: { id },
      attributes: ["modelName", "title"],
    });
    const modelName = item.modelName;
    const title = item.title;
    const items = await match[modelName].findAll({});
    const total = items.reduce((arr, cur) => {
      // 총 게임 수 => finalWin들의 합
      return arr + cur.finalWin;
    }, 0);
    let lists = items.map((item) => {
      return {
        main: item.main,
        sub: item.sub,
        // 0 / 0으로 나눌때 NaN
        victoryRate: isNaN(+item.win / +item.selected)
          ? 0
          : Math.floor((+item.win / +item.selected) * 100),
        winningRate: isNaN(+item.finalWin / total)
          ? 0
          : Math.floor((+item.finalWin / total) * 100),
        modelName, // 이미지 때문에
      };
    });
    // 내림차순
    const descending = (arr, key) => {
      return arr.sort((a, b) => b[key] - a[key]);
    };
    lists = descending(lists, "winningRate");
    res.json({
      lists,
      total,
      title,
    });
  } catch (err) {
    console.error(err);
  }
});
// 몇번째 카테코리인지, 라운드...
router.get("/:id/:round", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const model = await Favorite.findOne({
      where: { id },
      attributes: ["modelName", "title", "types", "explanation"],
    });
    // modelName은 이미지, 오디오 폴더 이름
    const modelName = model.modelName;
    const results = await match[modelName].findAll({});
    // 처음에 보낼땐 0의 값을 보내 => 그래야 파이널 지나고 서버에서 합칠 수 있어
    const original = results.map((item) => {
      return {
        id: item.id,
        main: item.main,
        sub: item.sub,
        selected: 0,
        win: 0,
        finalWin: 0,
      };
    });
    res.json({
      original: JSON.stringify(original),
      id, // 랭킹 클릭할때
      modelName,
      title: model.title,
      types: model.types,
      explanation: model.explanation,
    });
  } catch (err) {
    console.error(err);
  }
});
// final
router.post("/final", async (req, res) => {
  try {
    const original = JSON.parse(req.body.original);
    const modelName = req.body.modelName;
    const increments = original.map(async (obj) => {
      await match[modelName].update(
        {
          selected: sequelize.literal(`selected + ${obj.selected}`),
          win: sequelize.literal(`win + ${obj.win}`),
          finalWin: sequelize.literal(`finalWin + ${obj.finalWin}`),
        },
        { where: { id: obj.id } }
      );
    });
    await Promise.all(increments);
    res.json({});
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
