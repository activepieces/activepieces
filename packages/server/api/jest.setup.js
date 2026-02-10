const path = require('path');
const resolvedPath = path.resolve('packages/server/api/.env.tests');
require('dotenv').config({ path: resolvedPath});
console.log("Configuring jest " + resolvedPath)
