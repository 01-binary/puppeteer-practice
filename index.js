// 1. node.js의 fs모듈 추출
import puppeteer from "puppeteer";
import colors from "colors";
import axios from "axios";

import {
  writeResultFile,
  getFile,
  getMappingItem,
  getTotal,
  getRank,
  // changeTorIP,
  waiting,
  insertReviewData,
  getFilteredReview,
} from "./util.js";

const FILE_PATH = "./lotteimall_sampling_3000.tsv000";
const TEST_NUMBER_START = 1000;
const TEST_NUMBER_END = 1500;
const inputs = getFile(FILE_PATH);
const STAR_TEXT = "별점";

let result = [];

// var countAll = 0;
// var rankAll = 0;

(async () => {
  const browser = await puppeteer
    .launch
    // { headless: false }
    ();
  let page = await browser.newPage();
  // await page.setViewport({
  //   width: 1920,
  //   height: 1080,
  // });

  for (let i = TEST_NUMBER_START; i < TEST_NUMBER_END; i++) {
    let resultObj = {};
    const searchURL = `https://search.shopping.naver.com/search/all?query=${inputs[i].itemName}`;

    resultObj.itemName = inputs[i].itemName;
    resultObj.itemID = inputs[i].itemID;

    let res = await page.goto(searchURL);
    let chain = res.request().redirectChain();

    // await waiting(2500);
    while (chain?.length === 1) {
      console.log("Redirect Happen!".red);
      await waiting(20000);
      res = await page.goto(searchURL);
      chain = res.request().redirectChain();
      if(chain[0].url().includes("https://nid.naver.com/nidlogin.login")) break;
    }
    if(chain[0].url().includes("https://nid.naver.com/nidlogin.login")) {
      console.log("19세".red);
      resultObj.searchResult = null;
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

const getSearchData = async (page, searchURL) => {
  //검색 페이지 입장
  let searchResultArr = [];
  let rankCount;
  let reviewExistRankList = [];
  let parsedScript;
  //script Parsing
  try {
    parsedScript = await page.$eval("#__NEXT_DATA__", (ele) => ele.textContent);
    rankCount = await page.$eval(
      "#__next > div > div.style_container__1YjHN > div > div.style_content_wrap__1PzEo > div.style_content__2T20F > div.seller_filter_area > ul > li.active > a > span.subFilter_num__2x0jq",
      (ele) => ele.textContent
    );
  } catch (e) {
    let res = await page.goto(searchURL);
    let chain = res.request().redirectChain();
    console.log("Result Not Found IN SearchData".red);
    console.log("One More Call".red);
    // await waiting(2500);
    while (chain?.length === 1) {
      console.log("Redirect Happen!".red);
      await waiting(20000);
      res = await page.goto(searchURL);
      chain = res.request().redirectChain();
    }

    try {
      parsedScript = await page.$eval(
        "#__NEXT_DATA__",
        (ele) => ele.textContent
      );
      rankCount = await page.$eval(
        "#__next > div > div.style_container__1YjHN > div > div.style_content_wrap__1PzEo > div.style_content__2T20F > div.seller_filter_area > ul > li.active > a > span.subFilter_num__2x0jq",
        (ele) => ele.textContent
      );
    } catch (e) {
      console.log("Result Not Found".red);
      searchResultArr = null;
      return searchResultArr;
    }
  }

  try {
    if (rankCount) {
      parsedScript = JSON.parse(parsedScript);
      const searchProducts = parsedScript.props.pageProps.initialState.products;

      const resultList = searchProducts.list;
      const resultLength = getTotal(searchProducts.total);
      rankCount = getRank(rankCount);

      // rankAll += rankCount;
      // countAll += resultLength;
      // console.log(rankCount, resultLength);

      for (let i = 0; i < resultLength; ++i) {
        searchResultArr.push(await getMappingItem(resultList[i].item, i));
        try {
          const checkStar = await page.$eval(
            //ui는 1부터 시작이라 i+1
            `#__next > div > div.style_container__1YjHN > div > div.style_content_wrap__1PzEo > div.style_content__2T20F > ul > div > div:nth-child(${
              i + 1
            }) > li > div > div.basicList_info_area__17Xyo > div.basicList_etc_box__1Jzg6 > a > span > span`,
            (ele) => ele.textContent
          );

          if (checkStar.includes(STAR_TEXT)) {
            reviewExistRankList.push(i);
          } else {
            console.log("Unexpected Error".red);
            throw "Unexpected checkStar Error";
          }
        } catch (e) {
          //네이버 쇼핑이 아닌 경우
        }
      }

      console.log(
        "Has Review",
        reviewExistRankList?.length,
        reviewExistRankList
      );
      //각 검색어에 대한 script Parsing end, Review Check Start
      for (let i = 0; i < reviewExistRankList.length; ++i) {
        let reviewList = [];
        let rawReviews;
        try {
          rawReviews = await axios.get(
            `https://search.shopping.naver.com/api/review?nvMid=${
              resultList[reviewExistRankList[i]].item.id
            }&reviewType=ALL&sort=QUALITY&isNeedAggregation=N&isApplyFilter=N&page=1&pageSize=30`
          );
        } catch (e) {
          console.log("Redirect Happen! in Reviews".red);
          await waiting(20000);
        }

        while (
          rawReviews?.data?.message ===
            "Too many requests, please try again later." ||
          !rawReviews
        ) {
          console.log("Redirect Happen! in Reviews".red);
          await waiting(20000);
          try {
            rawReviews = await axios.get(
              `https://search.shopping.naver.com/api/review?nvMid=${
                resultList[reviewExistRankList[i]].item.id
              }&reviewType=ALL&sort=QUALITY&isNeedAggregation=N&isApplyFilter=N&page=1&pageSize=30`
            );
          } catch (e) {
            console.log("Redirect Happen! in Reviews".red);
          }
        }

        if (rawReviews?.data?.reviews)
          reviewList.push(...rawReviews.data.reviews);

        if (rawReviews?.data?.totalCount > 30) {
          try {
            rawReviews = await axios.get(
              `https://search.shopping.naver.com/api/review?nvMid=${
                resultList[reviewExistRankList[i]].item.id
              }&reviewType=ALL&sort=QUALITY&isNeedAggregation=N&isApplyFilter=N&page=2&pageSize=30`
            );
          } catch (e) {
            console.log("Redirect Happen! in Reviews".red);
            await waiting(20000);
          }

          while (
            rawReviews?.data?.message ===
              "Too many requests, please try again later." ||
            !rawReviews
          ) {
            console.log("Redirect Happen! in Reviews".red);
            await waiting(20000);
            try {
              rawReviews = await axios.get(
                `https://search.shopping.naver.com/api/review?nvMid=${
                  resultList[reviewExistRankList[i]].item.id
                }&reviewType=ALL&sort=QUALITY&isNeedAggregation=N&isApplyFilter=N&page=2&pageSize=30`
              );
            } catch (e) {
              console.log("Redirect Happen! in Reviews".red);
            }
          }
          if (rawReviews?.data?.reviews)
            reviewList.push(...rawReviews.data.reviews);
        }
        reviewList = getFilteredReview(reviewList);

        searchResultArr = insertReviewData(
          searchResultArr,
          resultList[i].item.rank,
          reviewList
        );
      }
      // for (let i = 0; i < reviewExistRankList.length; ++i) {
      //   let res = await page.goto(
      //     resultList[reviewExistRankList[i]].item.crUrl
      //   );

      //   // await waiting(1000);
      //   let detailUrl = await page.url();
      //   while (detailUrl?.includes("too-many-request")) {
      //     console.log("Redirect Happen! In Detail".red);
      //     await waiting(10000);
      //     res = await page.goto(resultList[reviewExistRankList[i]].item.crUrl);
      //     detailUrl = await page.url();
      //   }
      //   if (!detailUrl.includes("https://search.shopping.naver.com")) {
      //     console.log("Cant Crowl".red, detailUrl);
      //     continue;
      //   }
      //   //검증 끝
      //   console.log("Can Crowl".green, detailUrl);

      //   let reviewList = [];
      //   let getReviewCount;
      //   try {
      //     getReviewCount = await page.$eval(
      //       "#section_review > div.filter_sort_group__Y8HA1 > div.filter_evaluation_tap__-45pp > ul > li.filter_on__X0_Fb > a > em",
      //       (ele) => ele.textContent
      //     );
      //   } catch (e) {
      //     console.log("Star Exist But, No Reviews");
      //     continue;
      //   }

      //   await waiting(3000);

      //   getReviewCount = parseInt(getReviewCount.replace(/[^0-9]/g, ""));
      //   console.log("Max Review Count", getReviewCount);

      //   reviewList = await reviewPaging(reviewList, getReviewCount, page);

      //   console.log(
      //     "Accepted Review Count",
      //     reviewList.length,
      //     "Rank :",
      //     resultList[i].item.rank
      //   );
      //   searchResultArr = insertReviewData(
      //     searchResultArr,
      //     resultList[i].item.rank,
      //     reviewList
      //   );
      // }
    }
  } catch (e) {
    console.log(e);
    console.log("Unexpected Error".red);
    searchResultArr = null;
  }

  return searchResultArr;
};

const reviewPaging = async (reviewList, maxNum, page) => {
  let isNeedPaging = true;
  let pageCnt = 0;
  let cnt = maxNum;
  while (isNeedPaging) {
    let end = cnt - pageCnt * 20 > 20 ? 20 : cnt - pageCnt * 20;
    for (let i = 1; i <= end; ++i) {
      const reviewText = await page.$eval(
        `#section_review > ul > li:nth-child(${i}) > div.reviewItems_review__1eF8A > div > p`,
        (ele) => ele.textContent
      );
      reviewList.push(reviewText);
    }
    if (cnt - pageCnt * 20 > 20) {
      pageCnt += 1;
      if (pageCnt > 2) return reviewList;

      await page.click(
        `#section_review > div.pagination_pagination__2M9a4 > a:nth-child(${
          pageCnt + 1
        })`
      );
      await waiting(2000);
    } else {
      isNeedPaging = false;
    }
  }
  return reviewList;
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
