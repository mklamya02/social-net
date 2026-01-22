const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");
const authenticate = require("../middlewares/auth");

router.get("/", searchController.search);

module.exports = router;
