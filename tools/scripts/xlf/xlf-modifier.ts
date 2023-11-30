import * as fs from 'fs';
import * as xml2js from 'xml2js';

export class TranslationFile {
    xliff: {
      file: {
        body: {
          'trans-unit': ({
            'context-group': {
              context: { _: string }[];
            }[];
          }|undefined)[];
        }[];
      }[];
    };
    constructor(xliff: TranslationFile['xliff']) {
      this.xliff = xliff;
    }
  }
  
export function readXLFFile(filePath:string, callback:Function) {
  fs.readFile(filePath, 'utf-8', function (err:unknown, data:string) {
    if (err) {
      callback(err);
    } else {
      // Parse the XML content
      xml2js.parseString(data, function (err:unknown, result:unknown) {
        if (err) {
          callback(err);
        } else {
          // Pass the parsed result to the callback function
          callback(null, result);
        }
      });
    }
  });
}



export function removeContextsWithPrefix(result: TranslationFile, prefixes: string[]): TranslationFile {
  const copy: TranslationFile = JSON.parse(JSON.stringify(result));
  
  // Iterate through trans-unit elements
  if (copy.xliff.file[0].body[0]['trans-unit']) {
    copy.xliff.file[0].body[0]['trans-unit'] = copy.xliff.file[0].body[0]['trans-unit']?.map((transUnit) => {
      if (transUnit) {
        // Filter out context-group elements with matching prefixes
        transUnit['context-group'] = transUnit['context-group']?.filter((contextGroup: any) => {
          // Filter out context elements with matching prefixes
          const contextGroupShouldBeRemoved = contextGroup.context.find((ctx: any) =>
            prefixes.some(prefix => ctx._.startsWith(prefix))
          );
          return !contextGroupShouldBeRemoved;
        });

        // Remove trans-unit if context-group array is empty
        return transUnit['context-group']?.length > 0 ? transUnit : undefined;
      }
      return undefined;
    });
  }

  // Remove undefined elements from the array
  copy.xliff.file[0].body[0]['trans-unit'] = copy.xliff.file[0].body[0]['trans-unit'].filter(Boolean);
  return copy;
}
