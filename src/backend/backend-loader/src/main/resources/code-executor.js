const handler = require("./index");
const fs = require('fs');

async function main(){
   let rawdata = fs.readFileSync('_input.txt');
   let input = JSON.parse(rawdata);
   try{
      let output = await handler.code(input);
      fs.writeFileSync('_functionOutput.txt', output == undefined ? "" : JSON.stringify(output));
   }catch (exception){
      throw exception
   }
}

main();
