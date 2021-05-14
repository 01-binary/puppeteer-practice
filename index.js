import puppeteer from "puppeteer";
import colors from "colors";

import {
  writeResultFile,
  getFile,
  waiting,
  getAdultText,
  autoScroll,
  getSearchURL
} from "./util.js";
import getSearchData from "./search.js";

const FILE_PATH = "./lotteimall_sampling_3000.tsv000";
const TEST_NUMBER_START = 0;
const TEST_NUMBER_END = 500;
const inputs = getFile(FILE_PATH);

let result = [];
(async () => {
  const browser = await puppeteer.launch();
  let page = await browser.newPage();

  for (let i = TEST_NUMBER_START; i < TEST_NUMBER_END; i++) {
    let resultObj = {};

    const searchURL = getSearchURL(inputs[i].itemName);

    resultObj.itemName = inputs[i].itemName.replace(/"/g, "");
    resultObj.itemID = inputs[i].itemID.replace(/"/g, "");

    let res = await page.goto(searchURL);
    let chain = res.request().redirectChain();
    let checkAdult;

    while (chain?.length === 1) {
      console.log("Redirect Happen!".red);
      await waiting(20000);
      res = await page.goto(searchURL);
      chain = res.request().redirectChain();
      try {
        checkAdult = await getAdultText(page);
      } catch (e) {}
      if (checkAdult?.includes("Age")) break;
    }
    if (checkAdult?.includes("Age")) {
      console.log("19세".red);
      resultObj.searchResult = null;
      result.push(resultObj);
      continue;
    }

    await autoScroll(page);

    console.log(`${i + 1} START! total ${TEST_NUMBER_END}`);
    const searchResult = await getSearchData(page, searchURL);
    resultObj.searchResult = searchResult;

    /* 각 페이지 크롤링 끝 */
    console.log(`${i + 1} END! total ${TEST_NUMBER_END}`);

    result.push(resultObj);
  }
  await browser.close();
  await writeResultFile(result);

  console.log("End".blue);
})();