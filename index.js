// 1. node.js의 fs모듈 추출
import puppeteer from "puppeteer";
import { getFile, getMappingItem } from "./util.js";

const FILE_PATH = "./lotteimall_sampling_3000.tsv000";

const inputs = getFile(FILE_PATH);

let result = [];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (let i = 0; i < 1; i++) {
    let resultObj = {};
    resultObj.itemName = inputs[i].itemName;
    resultObj.itemID = inputs[i].itemID;

    await page.goto(
      `https://search.shopping.naver.com/search/all?query=${inputs[i].itemName}`
    );

    // await pageDown(page);
    // await autoScroll(page);

    // await page.evaluate(() => {
    //   window.scrollTo(0,window.document.body.scrollHeight);
    // });

    const searchResult = await getSearchData(page);
    resultObj.searchResult = searchResult;

    /* 각 페이지 크롤링 끝 */
    result.push(resultObj);
  }
  await browser.close();
  // console.log(result);
})();

const getSearchData = async (page) => {
  //검색 페이지 입장
  let searchResultObj = [];

  //script Parsing
  let parsedScript = await page.$eval(
    "#__NEXT_DATA__",
    (ele) => ele.textContent
  );

  parsedScript = JSON.parse(parsedScript);
  const searchProducts = parsedScript.props.pageProps.initialState.products;

  const resultList = searchProducts.list;
  let resultLength = searchProducts.total;

  resultLength = getTotal(resultLength);

  for (let i = 0; i < resultLength; ++i) {
    searchResultObj.push(getMappingItem(resultList[i].item));
  }

  return searchResultObj;
};

const getTotal = (total) => {
  if (total <= 40) return total;
  else return 40; //각 검색어 크롤링 데이터 갯수 제한
};


// const pageDown = async (page) => {
//   const scrollDelay = 1000;
//   const scrollHeight = "document.body.scrollHeight";
//   let previousHeight = await page.evaluate(scrollHeight);
//   await page.evaluate(`window.scrollTo(0, ${scrollHeight})`);
//   await page.waitForFunction(`${scrollHeight} > ${previousHeight}`);
//   await page.waitFor(scrollDelay);
// };

// async function autoScroll(page) {
//   await page.evaluate(async () => {
//     await new Promise((resolve, reject) => {
//       var totalHeight = 0;
//       var distance = 100;
//       var timer = setInterval(() => {
//         var scrollHeight = document.body.scrollHeight;
//         window.scrollBy(0, distance);
//         totalHeight += distance;

//         if (totalHeight >= scrollHeight) {
//           clearInterval(timer);
//           resolve();
//         }
//       }, 100);
//     });
//   });
// }
