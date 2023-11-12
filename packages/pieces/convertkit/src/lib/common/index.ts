export * from './broadcasts';
export * from './forms';
export * from './sequences';
export * from './tags';
export * from './purchases';
export * from './custom-fields';
export * from './webhooks';

import * as fs from 'fs';
import * as path from 'path';
export const log = async (message: object) => {
  if (process.env['AP_ENVIRONMENT'] !== 'dev') {
    return;
  }
  const filePath = path.join(__dirname, 'log.txt');
  // touch file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }

  const messageWithDate = { date: new Date(), ...message };

  fs.appendFile(
    filePath,
    JSON.stringify(messageWithDate, null, 2) + '\n\n',
    function (err: unknown) {
      if (err) throw err;
      console.log('Logging to: ', filePath);
    }
  );
};
