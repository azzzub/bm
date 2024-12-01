import db from "./db.js";

const newMedia = async (req, res) => {
  const page = req?.query?.page || 1;
  const content = 5;
  const collection = db.client
    .db(process.env.COLLECTION_DB)
    .collection("downloaded")
    .find({})
    .sort({ sortIndex: -1 })
    .skip((page - 1) * content)
    .limit(content);
  const result = [];
  for await (const doc of collection) {
    // Fix new IP!
    const _newMedia = [];
    doc?.newMedia?.forEach((e) => {
      try {
        return _newMedia.push({
          ...e,
          thumb:
            e.type === "video"
              ? process.env.URL + new URL(e.thumb).pathname.substring(1)
              : null,
          media: process.env.URL + new URL(e.media).pathname.substring(1),
        });
      } catch (error) {
        return _newMedia.push({
          ...e,
          thumb: e.type === "video" ? process.env.URL + e.thumb : null,
          media: process.env.URL + e.media,
        });
      }
    });
    result.push({
      ...doc,
      newMedia: _newMedia,
    });
  }

  return result;
};

export default {
  newMedia,
};
