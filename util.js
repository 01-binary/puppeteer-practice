import fs from "fs";
import Jimp from "jimp";

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

const IMG_SIZE = "140";
const MAX_ITEM_SIZE = 40;

const getMappingItem = async (item) => {
  const mapped = filteredKeys.reduce(
    (obj, key) => ({ ...obj, [key]: item[key] }),
    {}
  );

  if (item?.imageUrl) {
    const imgRGB = await covertImageToRGb(
      item?.imageUrl + "?type=f" + IMG_SIZE
    );
    mapped.imgRGB = imgRGB;
    // mapped.imgRGB = null;
  } else {
    mapped.imgRGB = null;
  }
  return mapped;
};

const covertImageToRGb = async (imgUrl) => {
  let imgRGB = [];

  await Jimp.read(imgUrl)
    .then((image) => {
      image.scan(
        0,
        0,
        image.bitmap.width,
        image.bitmap.height,
        function (x, y, idx) {
          // x, y is the position of this pixel on the image
          // idx is the position start position of this rgba tuple in the bitmap Buffer
          // this is the image

          const red = this.bitmap.data[idx + 0];
          const green = this.bitmap.data[idx + 1];
          const blue = this.bitmap.data[idx + 2];
          const alpha = this.bitmap.data[idx + 3];

          // rgba values run from 0 - 255
          // e.g. this.bitmap.data[idx] = 0; // removes red from this pixel
          imgRGB.push([red, green, blue]);
        }
      );
    })
    .catch((err) => {
      console.log("img convert error, ", err);
      imgRGB = [];
    });

  return imgRGB;
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

const getTotal = (total) => {
  if (total <= MAX_ITEM_SIZE) return total;
  else return MAX_ITEM_SIZE; //각 검색어 크롤링 데이터 갯수 제한
};

const writeResultFile = (result) => {
  const resultJSON = JSON.stringify(result);

  fs.writeFileSync("result.json", resultJSON);
};
export { writeResultFile, getFile, getMappingItem, getTotal };
