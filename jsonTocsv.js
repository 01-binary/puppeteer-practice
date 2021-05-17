import fs from "fs";
import { Parser } from "json2csv";

const FILE_PATH ="./title_include/";

for(let i = 1; i<=6; ++i) {
  const jsonFile = fs.readFileSync(FILE_PATH +`result${i}.json`, "utf8");
  const jsonData = JSON.parse(jsonFile);
  
  let output = [];
  jsonData.forEach((item) => {
    const itemName = item.itemName.replace(/"/g, "");
    const itemID = item.itemID.replace(/"/g, "");

    const searchResult = item.searchResult;
    if (searchResult) {
      searchResult.forEach((arr) => {
        let obj = {
          itemID: itemID,
          itemName: itemName,
          rank: arr.rank,
          productId: arr.id,
          productName: arr.productName,
          review_seq: "",
          review_title: "",
          review_content: "",
        };
  
        if (arr.reviewList) {
          arr.reviewList?.forEach((review, i) => {
            let temp = { ...obj };
            let review_title = review.title.replace(/\r/g, "").replace(/\n/g, "");
            let review_content = review.content.replace(/\r/g, "").replace(/\n/g, "");
            temp.review_seq = i + 1;
            temp.review_title = review_title;
            temp.review_content = review_content;
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
          itemID: itemID,
          itemName: itemName,
          rank: "",
          productId: "",
          productName: "",
          review_seq: "",
          review_title: "",
          review_content: "",
      };
      output.push(obj);
    }
  });
  
  const json2csvParser = new Parser({delimiter: '|'});
  const csv = json2csvParser.parse(output);
  
  fs.writeFileSync(`./result${i}.csv`, csv, 'utf8');
}

