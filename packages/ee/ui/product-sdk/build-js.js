const fs = require('fs-extra');
const concat = require('concat');
const wrapperPath =
  'packages/ee/product-embed/product-sdk/src/wrapper/ap-wrapper.js';
const cdnSDKLink = 'https://cdn.activepieces.com/sdk/ap-sdk.js';

const sdkBuildPath = 'builds/v1/ap-sdk.js';
const wrapperBuildPath = 'builds/v1/ap-wrapper.js';

(async function build() {
  await fixSDK();
  await fixWrapper();
})();

async function fixSDK() {
  const files = [
    './dist/packages/ee/product-embed/product-sdk/runtime.js',
    './dist/packages/ee/product-embed/product-sdk/polyfills.js',
    './dist/packages/ee/product-embed/product-sdk/main.js',
  ];
  await fs.ensureDir('builds');
  await fs.ensureDir('builds/v1');
  await concat(files, sdkBuildPath);

  const data = (await fs.readFile(sdkBuildPath, 'utf8')).toString();
  await concat(files, sdkBuildPath);
  await fs.writeFile(sdkBuildPath, data, 'utf8');
}

async function fixWrapper() {
  await fs.copy(wrapperPath, wrapperBuildPath);
  const data = (await fs.readFile(wrapperBuildPath, 'utf8')).toString();
  let wrapperResult = data.split('SDK_URL').join(cdnSDKLink);
  await fs.writeFile(wrapperBuildPath, wrapperResult, 'utf8');
}
