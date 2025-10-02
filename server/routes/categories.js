const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoriesByGender,
} = require("../controllers/categories_handler");

// GET routes
router.get("/", getCategories);
router.get("/:gender", getCategoriesByGender);

module.exports = router;
