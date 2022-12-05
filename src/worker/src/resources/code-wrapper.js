const handler = require("./index");
const fs = require('fs');

async function main(){
    //let rawdata = fs.readFileSync('_input.txt');
//    let input = JSON.parse(rawdata);
    let input = JSON.parse("{}");

    try{
        let output = await handler.codePiece(input);
        fs.writeFileSync('_functionOutput.txt', output == undefined ? "" : JSON.stringify(output));
    }catch (exception){
        throw exception
    }
}

main();
