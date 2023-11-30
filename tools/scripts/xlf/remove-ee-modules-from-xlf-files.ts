import * as fs from 'fs';
import { TranslationFile, readXLFFile, removeContextsWithPrefix } from './xlf-modifier';

const xml2js = require('xml2js');

// Example usage
const directoryPath = 'packages/ui/core/src/locale/messages.xlf';
const modulesToRemoveFromXlf = ['packages/ee/ui-platform', 'packages/ui/feature-chatbot'];

readXLFFile(directoryPath, function (err: unknown, result: TranslationFile) {
  if (err) {
    console.error(err);
  } else {
    const fixedFile = removeContextsWithPrefix(result, modulesToRemoveFromXlf);
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(fixedFile);
    fs.writeFile(directoryPath, xml, (err: any) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('File written successfully');
      }
    });
  }
});
