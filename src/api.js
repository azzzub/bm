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
    result.push(doc);
  }

  return result;
};

export default {
  newMedia,
};
