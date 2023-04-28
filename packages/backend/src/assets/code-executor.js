const handler = require("./index");
const fs = require('fs');

async function main(){
   let rawdata = fs.readFileSync('_input.txt');
   let input = JSON.parse(rawdata);
   let output = await handler.code(input);
   fs.writeFileSync('output.json', output == undefined ? "" : JSON.stringify(output));
}

main();
