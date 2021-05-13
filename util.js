import fs from "fs";
import Jimp from "jimp";
import axios from "axios";

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

const getMappingItem = async (item) => {
  const mapped = filteredKeys.reduce(
    (obj, key) => ({ ...obj, [key]: item[key] }),
    {}
  );
  mapped.imgSize = parseInt(IMG_SIZE);
  if (item?.imageUrl) {
    const imgRGB = await covertImageToRGb(item.imageUrl + "?type=f" + IMG_SIZE);
    mapped.imgRGB = imgRGB;
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
          imgRGB.push([
            image.getPixelColor(x, y).toString(16).toUpperCase().slice(0, 6),
          ]);
        }
      );
    })
    .catch((err) => {
      console.error("img convert error");
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

const getRank = (rank) => {
  //input : string
  let _rank = rank.replace(/,/g, "");
  return parseInt(_rank) > 40 ? 40 : parseInt(_rank);
};

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

const getPageSearchScript = async (page) => {
  let _parsedScript = await page.$eval(
    "#__NEXT_DATA__",
    (ele) => ele.textContent
  );

  return _parsedScript;
};

const getPageSearchRankCount = async (page) => {
  let _rankCount = await page.$eval(
    "#__next > div > div.style_container__1YjHN > div > div.style_content_wrap__1PzEo > div.style_content__2T20F > div.seller_filter_area > ul > li.active > a > span.subFilter_num__2x0jq",
    (ele) => ele.textContent
  );

  return _rankCount;
};

const getAdultText = async (page) => {
  let _checkAdult = await page.$eval(
    "#content > div.title > p",
    (ele) => ele.textContent
  );

  return _checkAdult;
}

const getStar = async (page, i) => {
  let _checkStar = await page.$eval(
    //ui는 1부터 시작이라 i+1
    `#__next > div > div.style_container__1YjHN > div > div.style_content_wrap__1PzEo > div.style_content__2T20F > ul > div > div:nth-child(${
      i + 1
    }) > li > div > div.basicList_info_area__17Xyo > div.basicList_etc_box__1Jzg6 > a > span > span`,
    (ele) => ele.textContent
  );

  return _checkStar;
}

const getRawReviews = async (itemID, pageNum) => {
  return await axios.get(
    `https://search.shopping.naver.com/api/review?nvMid=${
      itemID
    }&reviewType=ALL&sort=QUALITY&isNeedAggregation=N&isApplyFilter=N&page=${pageNum}&pageSize=30`
  );
}

const getSearchURL = (itemName) => {
  return `https://search.shopping.naver.com/search/all?query=${itemName}`;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
// const changeTorIP = async () => {
//   // await shell.exec("brew services restart tor");
//   // await execShellCommand("brew services restart tor");
//   try {
//     let res = await asyncExec("brew services restart tor");
//     let ip = await asyncExec(
//       "curl -s --socks5-hostname 127.0.0.1:9050 https://api.myip.com"
//     );
//     console.log("IP Changed", res, ip);
//   } catch (e) {
//     console.error("IP Change Error");
//   }
// };

// function execShellCommand(cmd) {
//   const exec = require("child_process").exec;
//   return new Promise((resolve, reject) => {
//     exec(cmd, (error, stdout, stderr) => {
//       if (error) {
//         console.warn(error);
//       }
//       resolve(stdout ? stdout : stderr);
//     });
//   });
// }

export {
  writeResultFile,
  getFile,
  getMappingItem,
  getTotal,
  getRank,
  delay,
  waiting,
  insertReviewData,
  getFilteredReview,
  getPageSearchScript,
  getPageSearchRankCount,
  getAdultText,
  getStar,
  getRawReviews,
  autoScroll,
  getSearchURL
};
