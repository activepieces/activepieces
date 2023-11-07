export * as broadcasts from './broadcasts';
export * as customFields from './custom-fields';
export * as forms from './forms';
export * as purchases from './purchases';
export * as sequences from './sequences';
export * as subscribers from './subscribers';
export * as tags from './tags';
export * as webhooks from './webhooks';

export const log = async (message: object) => {
  if (process.env['AP_ENVIRONMENT'] !== 'dev') {
    return;
  }
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'log.txt');
  // touch file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }

  let messageWithDate = { date: new Date(), ...message };

  fs.appendFile(
    filePath,
    JSON.stringify(messageWithDate, null, 2) + '\n\n',
    function (err: any) {
      if (err) throw err;
      console.log('Logging to: ', filePath);
    }
  );
};
