import fs from "fs";

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

export { tsvToJSON, getFile };
