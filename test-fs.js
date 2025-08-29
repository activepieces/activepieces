// test-fs.js
const fs = require('fs');
const path = require('path');

console.log('Testing file system access...');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

// List files in current directory
try {
  const files = fs.readdirSync('.');
  console.log('\nFiles in current directory:');
  console.log(files.join('\n'));
} catch (error) {
  console.error('Error reading directory:', error);
}

// Test writing a file
try {
  const testFilePath = path.join(__dirname, 'test-write.txt');
  fs.writeFileSync(testFilePath, 'Test file content');
  console.log(`\nSuccessfully wrote to ${testFilePath}`);
  
  // Clean up
  fs.unlinkSync(testFilePath);
  console.log('Test file cleaned up');
} catch (error) {
  console.error('Error writing test file:', error);
}
