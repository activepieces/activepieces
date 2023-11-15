import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { TranslationFile, readXLFFile, removeContextsWithPrefix } from './xlf-modifier';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const xml2js = require('xml2js');
async function findXlfFiles(directory: string): Promise<string[]> {
  try {
    const files = await readdir(directory);

    const xlfFiles = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directory, file);
        const fileStats = await stat(filePath);

        if (fileStats.isFile() && file.endsWith('.xlf')) {
          return filePath;
        }
          else {
          return null;
        }
      })
    );

    // Flatten the array to remove null values and subarray nesting
    return xlfFiles.filter(Boolean) as string[];
  } catch (error) {
    console.error('Error while scanning directory:', error);
    return [];
  }
}

// Example usage
const directoryPath = 'packages/ui/core/src/locale/messages.xlf';
const modulesToRemoveFromXlf = ['packages/ee/ui-platform','packages/ui/feature-chatbot'];

readXLFFile(directoryPath, function (err:unknown, result:TranslationFile) {
        if (err) {
            console.error(err);
        } else {
            // Now you can work with the parsed result
            modulesToRemoveFromXlf.forEach(modulePath=>{
              const fixedFile =  removeContextsWithPrefix(result, modulePath);
              var builder = new xml2js.Builder();
              var xml = builder.buildObject(fixedFile);
              fs.writeFile(directoryPath, xml, (err:any) => {
              if (err) {
                  console.error('Error writing to file:', err);
              } else {
                  console.log('File written successfully');
              }
              });
            });

           
        }
});
