import fs from "fs";
import { Parser } from "json2csv";

const FILE_PATH ="./result/";

for(let i = 1; i<=6; ++i) {
  const jsonFile = fs.readFileSync(FILE_PATH +`result${i}.json`, "utf8");
  const jsonData = JSON.parse(jsonFile);
  
  let output = [];
  jsonData.forEach((item) => {
    const itemName = item.itemName.replace(/"/g, "");
    const searchResult = item.searchResult;
    if (searchResult) {
      searchResult.forEach((arr) => {
        let obj = {
          itemName: itemName,
          rank: arr.rank,
          productId: arr.id,
          productName: arr.productName,
          review_seq: "",
          review: "",
        };
  
        if (arr.reviewList) {
          arr.reviewList?.forEach((review, i) => {
            let temp = { ...obj };
            temp.review_seq = i + 1;
            review = review.replace(/\r/g, "");
            review = review.replace(/\n/g, "");
            temp.review = review;
            output.push(temp);
            // console.log(itemName, '|', arr.rank, '|', arr.id, '|', arr.productName, '|', i + 1, '|', review);
          });
        } else {
          output.push(obj);
          // console.log(itemName,'|', arr.rank, '|', arr.id, '|' , arr.productName);
        }
      });
    } else {
      let obj = {
        itemName: itemName,
        rank: "",
        productId: "",
        productName: "",
        review_seq: "",
        review: "",
      };
      output.push(obj);
    }
  });
  
  const json2csvParser = new Parser({delimiter: '|'});
  const csv = json2csvParser.parse(output);
  
  fs.writeFileSync(`./result${i}.csv`, csv, 'utf8');
}

