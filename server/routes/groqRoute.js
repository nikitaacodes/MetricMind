// server/routes/groqRoute.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { processImageWithGroq } = require("../controllers/groqController");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post("/describe", upload.single("image"), processImageWithGroq);

module.exports = router;
