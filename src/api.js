import db from "./db.js";

const newMedia = async () => {
  const collection = db.client
    .db(process.env.COLLECTION_DB)
    .collection("downloaded")
    .find({})
    .sort({ sortIndex: -1 })
    .limit(10);
  const result = [];
  for await (const doc of collection) {
    result.push(doc);
  }

  return result;
};

export default {
  newMedia,
};
