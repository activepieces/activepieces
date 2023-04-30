const handler = require("./index");
const fs = require('fs');

async function main() {
   let rawdata = fs.readFileSync('_input.txt');
   let input = JSON.parse(rawdata);
   try {

      let output = await handler.code(input);
      fs.writeFileSync('output.json', JSON.stringify({
         status: "OK",
         response: output == undefined ? "" : JSON.stringify(output)
      }));
   } catch (exception) {
      // The frontend read standard error
      console.error(exception);
      fs.writeFileSync('output.json', JSON.stringify({
         status: "ERROR"
      }));
   }
}

main();
