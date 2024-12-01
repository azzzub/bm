import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import https from "node:https";

const convertCookiesToString = (cookies) => {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join(";");
};

const downloadPhoto = async (url, filename) => {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  fs.writeFile(`downloaded/${filename}`, response.data, (err) => {
    if (err) throw err;
    console.log(`${filename} success`);
  });
};

async function downloadVideo(videoUrl, filename) {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const outputLocationPath = path.resolve(
    __dirname,
    `../downloaded/${filename}${getFileExtension(videoUrl)}`
  );
  const writer = fs.createWriteStream(outputLocationPath);

  const response = await axios({
    url: videoUrl,
    timeout: 120000,
    httpsAgent: new https.Agent({ keepAlive: true }),
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function getFileExtension(fileUrl) {
  const parsedUrl = url.parse(fileUrl);
  const fileExtension = path.extname(parsedUrl.pathname);
  return fileExtension;
}

export default {
  convertCookiesToString,
  downloadPhoto,
  downloadVideo,
  getFileExtension,
};
