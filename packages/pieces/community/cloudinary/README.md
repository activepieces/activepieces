# Cloudinary MCP Standalone Scripts

This directory contains standalone Node.js scripts for interacting with Cloudinary as an MCP (Managed Connection Provider).

## Setup
- Ensure you have a Cloudinary account and API credentials (cloud name, API key, API secret).
- For uploads, create an **unsigned upload preset** in your Cloudinary dashboard and whitelist it for unsigned uploads.
- Place your credentials in the scripts or use environment variables as needed.
- Place a sample file named `sample.jpg` in this directory for upload tests.

## Features
- **Upload Resource:** `test-upload.js` (uses unsigned upload preset)
- **Delete Resource:** `delete-resource-sdk-test.js`
- **Transform Resource:** `transform-resource-sdk-test.js`
- **Find Resource by Public ID:** `find-resource-by-public-id-sdk-test.js`
- **Usage Report:** `create-usage-report-sdk-test.js`
- **Poll New Resources:** `poll-new-resources-sdk-test.js`
- **Poll New Tags:** `poll-new-tags-sdk-test.js`
- **Custom API Call:** `custom-api-call-sdk-test.js`

## Usage
Run any script with Node.js, e.g.:

```sh
node test-upload.js
node delete-resource-sdk-test.js
node transform-resource-sdk-test.js
node find-resource-by-public-id-sdk-test.js
node create-usage-report-sdk-test.js
node poll-new-resources-sdk-test.js
node poll-new-tags-sdk-test.js
node custom-api-call-sdk-test.js
```

## Notes
- These scripts use the official Cloudinary SDK or direct API calls for reliability.
- For uploads, ensure your unsigned preset is whitelisted in Cloudinary.
- Update public IDs in scripts as needed for your tests.

---
**This approach is recommended for reliability until MCP/Activepieces action context issues are resolved.** 