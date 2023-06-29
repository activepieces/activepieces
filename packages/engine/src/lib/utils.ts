import { readFileSync, writeFileSync } from 'fs';

export class Utils {
  public static parseJsonFile(filePath: string) {
    try {
      const file = readFileSync(filePath, 'utf-8');
      return JSON.parse(file.toString());
    } catch (e) {
      throw Error((e as Error).message);
    }
  }
  
  public static writeToJsonFile(filePath: string, obj: any) {
    writeFileSync(
      filePath,
      JSON.stringify(obj, (key: string, value: any) => {
        if (value instanceof Map) {
          return Object.fromEntries(value);
        } else {
          return value;
        }
      }),
      'utf-8'
    );
  }

  public static tryParseJson(value: string): any {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
}
