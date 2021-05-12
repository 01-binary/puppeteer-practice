import fs from "fs";
import Jimp from "jimp";
// import shell from "shelljs";
import util from "util";
import { exec } from "child_process";

const asyncExec = util.promisify(exec);

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

const IMG_SIZE = "40";
const MAX_ITEM_SIZE = 40;

const getMappingItem = async (item, i) => {
  const mapped = filteredKeys.reduce(
    (obj, key) => ({ ...obj, [key]: item[key] }),
    {}
  );
  mapped.imgSize = parseInt(IMG_SIZE);
  if (item?.imageUrl) {
    const imgRGB = await covertImageToRGb(item.imageUrl + "?type=f" + IMG_SIZE);
    // console.log(i, item.imageUrl + "?type=f" + IMG_SIZE);
    mapped.imgRGB = imgRGB;
    // mapped.imgRGB = null;
  } else {
    console.error("imageUrl not found");
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
          // e.g. this.bitmap.data[idx] = 0; // removes red from this pixel
          imgRGB.push([
            image.getPixelColor(x, y).toString(16).toUpperCase().slice(0, 6),
          ]);
        }
      );
    })
    .catch((err) => {
      console.error("img convert error, ", err);
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

const changeTorIP = async () => {
  // await shell.exec("brew services restart tor");
  // await execShellCommand("brew services restart tor");
  try {
    let res = await asyncExec("brew services restart tor");
    let ip = await asyncExec(
      "curl -s --socks5-hostname 127.0.0.1:9050 https://api.myip.com"
    );
    console.log("IP Changed", res, ip);
  } catch (e) {
    console.error("IP Change Error");
  }
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

const getRank = (rank) => {
  //input : string
  let _rank = rank.replace(/,/g, "");
  return parseInt(_rank) > 40 ? 40 : parseInt(_rank);
};

function execShellCommand(cmd) {
  const exec = require("child_process").exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waiting = async (time = 3000, logFlag = false) => {
  await delay(time);
  if (logFlag) {
    console.log("Waiting Done!".yellow);
  }
};

const insertReviewData = (searchResultArr, rank, reviewList) => {
  for (let i = 0; i < searchResultArr.length; ++i) {
    if (searchResultArr[i].rank === rank) {
      searchResultArr[i].reviewList = reviewList;
    }
  }
  return searchResultArr;
};

const getFilteredReview = (reviewList) => {
  let filtered = reviewList?.map((obj, i) => {
    let { content } = obj;
    content = content.replace(/<em>/g, "");
    content = content.replace(/<\/em>/g, "");
    content = content.replace(/<br>/g, "");

    return content;
  });
  return filtered;
};

export {
  writeResultFile,
  getFile,
  getMappingItem,
  getTotal,
  getRank,
  changeTorIP,
  delay,
  waiting,
  insertReviewData,
  getFilteredReview,
};
