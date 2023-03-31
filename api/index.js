const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const Post = require("./models/Post");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
require("dotenv").congif();

const salt = bcrypt.genSaltSync(10);
const secret = "hjgdqo72bdlsae27";

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000  " }));
// app.options("*", cors());
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

app.get("/", (req, res) => {
  res.json("hello");
});

app.post("/register", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username: username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      });
    } else res.status(400).json("Wrong credentials");
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, secret, {}, (err, info) => {
      if (err) throw err;
      else res.json(info);
    });
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.post("/post", upload.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { title, summary, content } = req.body;
      const PostDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.id,
      });

      res.json(PostDoc);
    });
  }
});

app.get("/post", async (req, res) => {
  try {
    res.json(
      await Post.find()
        .populate("author", ["username"])
        .sort({ createdAt: -1 })
        .limit(20)
    );
  } catch (error) {
    console.log("Error", error);
  }
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Post.findById(id).populate("author", ["username"]));
});

app.listen(4000, () => {
  mongoose.connect(process.env.MONGO_CONNECTION_STRING);
  console.log("Listening in port 4000 and connected to DB");
});
