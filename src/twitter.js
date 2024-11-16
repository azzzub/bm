import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import db from "./db.js";
import axios from "axios";
import utils from "./utils.js";

puppeteer.use(StealthPlugin());

const login = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );

    await page.goto("https://x.com/i/flow/login");
    await page.waitForNetworkIdle({ idleTime: 1500 });
    await page.waitForSelector("[autocomplete=username]");
    await page.type("[autocomplete=username]", process.env.TWITTER_UNAME, {
      delay: 50,
    });
    await page.evaluate(() =>
      document.querySelector("button:nth-child(6)").click()
    );
    await page.waitForNetworkIdle({ idleTime: 1500 });
    await page.waitForSelector('[autocomplete="current-password"]');
    await page.type(
      '[autocomplete="current-password"]',
      process.env.TWITTER_PASS,
      { delay: 50 }
    );
    await page.evaluate(() => document.querySelectorAll("button")[4].click());
    await page.waitForNetworkIdle({ idleTime: 1500 });

    const cookies = await page.cookies();
    const collection = db.client
      .db(process.env.COLLECTION_DB)
      .collection("twitter");
    const result = await collection.insertOne({
      cookies,
      time: new Date(),
    });

    return result;
  } catch (error) {
    console.error(error);

    return error;
  } finally {
    await browser.close();
  }
};

const bookmarked = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const collection = db.client
      .db(process.env.COLLECTION_DB)
      .collection("twitter")
      .find({})
      .sort({ time: -1 });
    let cookies;
    for await (const doc of collection) {
      cookies = doc.cookies;
    }
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );

    await page.setCookie(...cookies);
    await page.goto("https://x.com/i/bookmarks");

    await page.reload();
    const req = await page.waitForRequest((request) => {
      return request.url().includes("Bookmarks?variables");
    });

    const _url = req.url().replace("count%22%3A20", "count%22%3A100");
    const headers = req.headers();
    const returnedCookie = await page.cookies();

    const res = await axios.get(_url, {
      headers: {
        ...headers,
        Cookie: utils.convertCookiesToString(returnedCookie),
      },
    });

    const bookmarkedData =
      res.data.data?.bookmark_timeline_v2?.timeline?.instructions?.[0]?.entries.filter(
        (e) => e.entryId.includes("tweet-")
      );

    const collectionBD = db.client
      .db(process.env.COLLECTION_DB)
      .collection("bookmarked_history");
    const prev = collectionBD
      .find({})
      .sort({
        time: -1,
      })
      .limit(1);
    let prevRes = {};
    for await (const doc of prev) {
      prevRes = doc;
    }

    const sortIndexPrev = prevRes?.data?.map((e) => {
      return {
        entryId: e.entryId,
        sortIndex: e.sortIndex,
      };
    });

    const _bd = bookmarkedData.map((e) => {
      return {
        entryId: e.entryId,
        sortIndex: e.sortIndex,
      };
    });

    let insertRes;
    let insertVal = [];
    if (!sortIndexPrev) {
      insertVal = bookmarkedData;
    } else if (sortIndexPrev?.[0]?.entryId !== _bd?.[0]?.entryId) {
      insertVal = bookmarkedData?.filter(
        (e) => e.sortIndex > Number.parseInt(sortIndexPrev?.[0]?.sortIndex)
      );
    }

    if (insertVal.length !== 0) {
      insertRes = await collectionBD.insertOne({
        data: insertVal,
        time: new Date(),
      });
    }

    return {
      sortIndexPrev,
      _bd,
      prevRes,
      insertVal,
      insertRes,
    };
  } catch (error) {
    console.error(error);

    return error.message;
  } finally {
    await browser.close();
  }
};

const download = async () => {
  const collectionBD = db.client
    .db(process.env.COLLECTION_DB)
    .collection("bookmarked_history");
  const prev = collectionBD
    .find({
      downloaded: {
        $exists: false,
      },
    })
    .sort({
      time: 1,
    });
  const prevRes = [];
  for await (const doc of prev) {
    prevRes.push(doc);
  }

  const sterilize = prevRes.map((e) => {
    const data = e.data.map((ee) => {
      let legacy = ee?.content?.itemContent?.tweet_results?.result?.legacy;
      if (!legacy) {
        legacy = ee?.content?.itemContent?.tweet_results?.result?.tweet?.legacy;
      }

      return {
        entryId: ee.entryId,
        sortIndex: ee.sortIndex,
        legacy,
      };
    });
    return {
      _id: e._id,
      data,
    };
  });

  const getMedia = sterilize.map((e) => {
    const data = e.data.map((ee) => {
      const _md = ee.legacy.entities.media.map((eee) => {
        if (eee.type === "photo") {
          return {
            type: eee.type,
            media: eee.media_url_https,
          };
        }

        return {
          type: eee.type,
          thumb: eee.media_url_https,
          media:
            eee.video_info.variants[eee.video_info.variants.length - 1].url,
        };
      });

      return {
        ...ee,
        media: _md,
      };
    });

    return {
      _id: e._id,
      data,
    };
  });

  const downloadMedia = await Promise.all(
    getMedia.map(async (e) => {
      const data = await Promise.all(
        e.data.map(async (ee) => {
          const newMedia = [];
          await Promise.all(
            ee.media.map(async (eee, i) => {
              if (eee.type === "photo") {
                const filename = `${ee.entryId}-${i}${utils.getFileExtension(
                  eee.media
                )}`;

                try {
                  await utils.downloadPhoto(eee.media, filename);

                  newMedia.push({
                    type: eee.type,
                    media: `${process.env.URL}downloaded/${filename}`,
                  });
                } catch (error) {
                  newMedia.push({
                    type: eee.type,
                    media: `${process.env.URL}error.png`,
                    error: error.message,
                  });
                }
              } else {
                const thumbFilename = `${
                  ee.entryId
                }-${i}${utils.getFileExtension(eee.thumb)}`;

                try {
                  await utils.downloadPhoto(eee.thumb, thumbFilename);

                  const mediaFilename = `${ee.entryId}-${i}`;

                  await utils.downloadVideo(eee.media, mediaFilename);
                  newMedia.push({
                    type: eee.type,
                    thumb: `${process.env.URL}downloaded/${thumbFilename}`,
                    media: `${
                      process.env.URL
                    }downloaded/${mediaFilename}${utils.getFileExtension(
                      eee.media
                    )}`,
                  });
                } catch (error) {
                  newMedia.push({
                    type: eee.type,
                    thumb: `${process.env.URL}error.png`,
                    media: `${process.env.URL}error.png`,
                    error: error.message,
                  });
                }
              }
            })
          );

          await collectionBD.updateOne(
            {
              _id: e._id,
            },
            {
              $set: {
                downloaded: true,
              },
            }
          );

          return {
            ...ee,
            newMedia,
            time: new Date(),
          };
        })
      );
      await collectionBD.updateOne(
        {
          _id: e._id,
        },
        {
          $set: {
            downloaded: true,
          },
        }
      );
      return {
        ...e,
        data,
      };
    })
  );

  const newTweetList = [];
  downloadMedia.map((e) => {
    e.data.map((ee) => {
      newTweetList.push(ee);
    });
  });

  let downloaded = {};
  if (newTweetList.length > 0) {
    const collectionDownload = db.client
      .db(process.env.COLLECTION_DB)
      .collection("downloaded");
    downloaded = await collectionDownload.insertMany(newTweetList);
  }

  return downloaded;
};

export default {
  login,
  bookmarked,
  download,
};
