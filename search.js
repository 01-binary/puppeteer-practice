import colors from "colors";
import {
  getMappingItem,
  getTotal,
  getRank,
  waiting,
  insertReviewData,
  getFilteredReview,
  getPageSearchScript,
  getPageSearchRankCount,
  getStar,
  getRawReviews,
} from "./util.js";
const STAR_TEXT = "별점";
const REVIEW_BLOCK_TEXT = "Too many requests, please try again later.";

const getSearchData = async (page, searchURL) => {
  //검색 페이지 입장
  let searchResultArr = [];
  let reviewExistRankList = [];
  let parsedScript;
  let rankCount;

  //script Parsing
  try {
    parsedScript = await getPageSearchScript(page);
    rankCount = await getPageSearchRankCount(page);
  } catch (e) {
    let res = await page.goto(searchURL);
    let chain = res.request().redirectChain();
    console.log("Result Not Found IN SearchData".red);
    console.log("One More Call".red);

    while (chain?.length === 1) {
      console.log("Redirect Happen!".red);
      await waiting(20000);
      res = await page.goto(searchURL);
      chain = res.request().redirectChain();
    }

    try {
      parsedScript = await getPageSearchScript(page);
      rankCount = await getPageSearchRankCount(page);
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

      for (let i = 0; i < resultLength; ++i) {
        searchResultArr.push(await getMappingItem(resultList[i].item, i));
        try {
          const checkStar = await getStar(page, i);
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
        const currentItemId = resultList[reviewExistRankList[i]].item.id;

        do {
          try {
            rawReviews = await getRawReviews(currentItemId, 1);
          } catch (e) {
            console.log("Review Request Block !".yellow);
            await waiting(20000);
          }
        } while (
          rawReviews?.data?.message === REVIEW_BLOCK_TEXT ||
          !rawReviews
        );

        if (rawReviews?.data?.reviews)
          reviewList.push(...rawReviews.data.reviews);

        if (rawReviews?.data?.totalCount > 30) {
          do {
            try {
              rawReviews = await getRawReviews(currentItemId, 2);
            } catch (e) {
              console.log("Review Request Block !".yellow);
              await waiting(20000);
            }
          } while (
            rawReviews?.data?.message === REVIEW_BLOCK_TEXT ||
            !rawReviews
          );

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
    }
  } catch (e) {
    console.log(e);
    console.log("Unexpected Error".red);
    searchResultArr = null;
  }

  return searchResultArr;
};

export default getSearchData;
