import "dotenv/config";

import express from "express";
import twitter from "./src/twitter.js";
import api from "./src/api.js";

const app = express();
const port = process.env.PORT;

app.use("/downloaded", express.static("downloaded"));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/twitter/login", async (req, res) => {
  const title = await twitter.login();
  res.send(title);
});

app.get("/twitter/bookmark", async (req, res) => {
  const bookmarks = await twitter.bookmarked();
  res.send(bookmarks);
});

app.get("/twitter/download", async (req, res) => {
  const download = await twitter.download();
  res.send(download);
});

app.get("/api/new_media", async (req, res) => {
  const newMedia = await api.newMedia(req, res);
  res.send(newMedia);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
