// 1. node.js의 fs모듈 추출
import puppeteer from "puppeteer";
import colors from "colors";

import {
  writeResultFile,
  getFile,
  getMappingItem,
  getTotal,
  getRank,
  // changeTorIP,
} from "./util.js";

const FILE_PATH = "./lotteimall_sampling_3000.tsv000";
const TEST_NUMBER = 100;
const inputs = getFile(FILE_PATH);

let result = [];

let countAll = 0;
let rankAll = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  let page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  for (let i = 0; i < TEST_NUMBER; i++) {
    let resultObj = {};
    const searchURL = `https://search.shopping.naver.com/search/all?query=${inputs[i].itemName}`;

    resultObj.itemName = inputs[i].itemName;
    resultObj.itemID = inputs[i].itemID;

    
    let res = await page.goto(searchURL);
    let chain = res.request().redirectChain();
    
    await waiting(1500);
    while (chain?.length === 1) {
      console.log("Redirect Happen!".red);
      await waiting(20000);

      res = await page.goto(searchURL);
      chain = res.request().redirectChain();
    }

    await autoScroll(page);

    console.log(`${i} START! total ${TEST_NUMBER}`);
    const searchResult = await getSearchData(page);
    resultObj.searchResult = searchResult;

    /* 각 페이지 크롤링 끝 */
    console.log(`${i} END! total ${TEST_NUMBER}`);

    result.push(resultObj);
  }
  await browser.close();

  console.log(countAll.blue, rankAll.blue);

  await writeResultFile(result);
})();

const getSearchData = async (page) => {
  //검색 페이지 입장
  let searchResultObj = [];
  let rankCount;

  //script Parsing
  let parsedScript = await page.$eval(
    "#__NEXT_DATA__",
    (ele) => ele.textContent
  );

  try {
    rankCount = await page.$eval(
      "#__next > div > div.style_container__1YjHN > div > div.style_content_wrap__1PzEo > div.style_content__2T20F > div.seller_filter_area > ul > li.active > a > span.subFilter_num__2x0jq",
      (ele) => ele.textContent
    );

    if (rankCount) {
      parsedScript = JSON.parse(parsedScript);
      const searchProducts = parsedScript.props.pageProps.initialState.products;

      const resultList = searchProducts.list;
      const resultLength = getTotal(searchProducts.total);
      rankCount = getRank(rankCount);

      rankAll += rankCount;
      countAll += resultLength;

      // console.log(resultLength, rankCount);

      for (let i = 0; i < resultLength; ++i) {
        searchResultObj.push(await getMappingItem(resultList[i].item, i));
      }
    }
  } catch (e) {
    console.log("Result Not Found".red);
    searchResultObj = null;
  }

  return searchResultObj;
};

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

const waiting = async (time = 3000, logFlag = false) => {
  await delay(time);
  if(logFlag) {
    console.log("Waiting Done!".yellow);
  }
};
