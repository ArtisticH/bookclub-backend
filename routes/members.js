const express = require("express");
const { Book, Member, Attend } = require("../models/models");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 멤버인 애들만 골라
    let results = await Member.findAll({
      attributes: ["nick", "id"],
      where: { type: "MEMBER" },
    });
    const members = results.map((item) => {
      return {
        id: item.id,
        nick: item.nick,
      };
    });
    results = await Book.findAll({
      attributes: ["id", "title", "MemberId"],
    });
    const books = results.map((item) => {
      return {
        id: item.id,
        title: item.title,
        MemberId: item.MemberId,
      };
    });
    const totalBooks = books.length;
    results = await Attend.findAll({});
    let attend = {};
    results.forEach((item) => {
      attend[item.MemberId] = ++attend[item.MemberId] || 1;
    });
    res.json({
      members,
      books,
      totalBooks,
      attend,
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
