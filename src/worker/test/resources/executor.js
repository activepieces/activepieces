var codeFilePath = process.argv[2];
var params = JSON.parse(process.argv[3]);

const code = require(codeFilePath);

code.codePiece(params)
  .then(output => console.log(output))
  .catch(err => console.error(err.message));
