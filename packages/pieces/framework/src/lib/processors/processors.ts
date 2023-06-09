import { isNil, isString } from "lodash";
import { ApFile, PieceProperty } from "../property";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import isBase64 from 'is-base64';
import axios from "axios";
import path from "path";

export type ProcessorFn = (property: PieceProperty, value: any) => any;

export class Processors {

  static number(property: PieceProperty, value: any): number | undefined | null {
    if (isNil(value)) {
      return value;
    }
    if (value === '') {
      return NaN;
    }
    return Number(value);
  }

  static datetime(property: PieceProperty, value: any): string | undefined {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const dateTimeString = value;
    try {
      if (!dateTimeString) throw Error('Undefined input');
      return dayjs.tz(dateTimeString, 'UTC').toISOString();
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  static async file (property: PieceProperty, urlOrBase64: unknown): Promise<ApFile | null> {
    // convertUrlOrBase64ToFile
    if (isNil(urlOrBase64) || !isString(urlOrBase64)) {
      return null;
    }
    // Get the file from the URL
    try {
      // Check if the string is a Base64 string
      if (isBase64(urlOrBase64, { allowMime: true })) {
        const matches = urlOrBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        let base64 = urlOrBase64;
        let contentType: string|null = null;

        if (matches && matches?.length === 3) {
          contentType = matches[1];
          base64 = matches[2];

          // You need to provide how you decide filename and extension in case of base64 string
          const filename = 'unknown';
          const extension = contentType.split('/')[1];

          return {
            filename: filename + "." + extension,
            extension,
            base64,
          };
        }

      }
      const response = await axios.head(urlOrBase64);
      const contentType = response.headers['content-type'];

      // Check if content type is file
      if (!contentType || !(contentType.startsWith('application/') || contentType.startsWith("image") || contentType === 'application/octet-stream')) {
        return null;
      }
      const fileResponse = await axios.get(urlOrBase64, {
        responseType: 'arraybuffer',
      });

      // Get filename and extension
      const filename = path.basename(urlOrBase64);
      // Remove dot from extension
      const extension = path.extname(urlOrBase64)?.substring(1);
      // Convert file data to base64
      const base64 = Buffer.from(fileResponse.data, 'binary').toString('base64');

      // Return the ApFile object
      return {
        filename,
        extension,
        base64,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };
}
