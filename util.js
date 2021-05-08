import fs from "fs";

const filteredKeys = [
  "rank",
  "id",
  "mallProductId",
  "mallName",
  "productName",
  "productTitle",
  "price",
  "category1Id",
  "category2Id",
  "category3Id",
  "category1Name",
  "category2Name",
  "category3Name",
  "maker",
  "brandNo",
  "attributeValue",
  "characterValue",
  "atmtTag",
  "lowMallList",
];

const getMappingItem = (item) => {
  const mapped = filteredKeys.reduce((obj, key) => ({ ...obj, [key]: item[key] }), {});
  console.log(item?.imageUrl);
};

const tsvToJSON = (tsv_string) => {
  const rows = tsv_string.split("\n");
  const jsonArray = [];
  const header = rows[0].split("\t");
  for (let i = 1; i < rows.length; i++) {
    let obj = {};
    let row = rows[i].split("\t");
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = row[j];
    }
    jsonArray.push(obj);
  }
  return jsonArray;
};

const getFile = (file_path) => {
  const file_tsv = fs.readFileSync(file_path);
  const string_tsv = file_tsv.toString();
  return tsvToJSON(string_tsv);
};

export { getFile, getMappingItem };
