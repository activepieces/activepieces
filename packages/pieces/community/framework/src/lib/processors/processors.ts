import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isBase64 from 'is-base64';
import axios from 'axios';
import { ProcessorFn } from './types';
import { isNil, isString } from '@activepieces/shared';
import { ApFile } from '../property/input/file-property';

export class Processors {
  static json: ProcessorFn<string | undefined | null, unknown | undefined> = (
    property,
    value
  ) => {
    if (isNil(value)) {
      return value;
    }
    try {
      if (typeof value === 'object') {
        return value;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };

  static number: ProcessorFn<
    string | number | undefined | null,
    number | null | undefined
  > = (property, value) => {
    if (isNil(value)) {
      return value;
    }
    if (value === '') {
      return NaN;
    }
    return Number(value);
  };

  static string: ProcessorFn<
    string | number | undefined | null,
    string | null | undefined
  > = (property, value) => {
    if (isNil(value)) {
      return value;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return value.toString();
  }

  static datetime: ProcessorFn<
    number | string | undefined | null,
    string | undefined
  > = (property, value) => {
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
  };

  static file: ProcessorFn<unknown, Promise<ApFile | null>> = async (
    property,
    urlOrBase64
  ) => {
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

        if (matches && matches?.length === 3) {
          base64 = matches[2];

          return new ApFile(
            'unknown.bin',
            Buffer.from(base64, 'base64'),
          );
        }
      }

      const fileResponse = await axios.get(urlOrBase64, {
        responseType: 'arraybuffer',
      });

      // Default filename: last part of the URL.
      let filename = urlOrBase64.substring(urlOrBase64.lastIndexOf('/') + 1);

      // Check for filename in the Content-Disposition header.
      const contentDisposition = fileResponse.headers['content-disposition'];
      if (contentDisposition) {
        const contentDispositionFilename = this.getContentDispositionFileName(contentDisposition);
        if (contentDispositionFilename) {
          filename = contentDispositionFilename;
        }
      }

      // Return the ApFile object
      return new ApFile(
        filename,
        Buffer.from(fileResponse.data, 'binary'),
        // Only take the extension when there is a dot in the filename.
        filename.split('.').length > 1 ? filename.split('.').pop() : undefined,
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  static getContentDispositionFileName(disposition: string): string | null {
    const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-.]+)(?:; ?|$)/i;
    const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;

    let fileName: string | null = null;
    if (utf8FilenameRegex.test(disposition)) {
      const result = utf8FilenameRegex.exec(disposition);
      if (result && result.length > 1) {
        fileName = decodeURIComponent(result[1]);
      }
    } else {
      // prevent ReDos attacks by anchoring the ascii regex to string start and
      // slicing off everything before 'filename='
      const filenameStart = disposition.toLowerCase().indexOf('filename=');
      if (filenameStart >= 0) {
        const partialDisposition = disposition.slice(filenameStart);
        const matches = asciiFilenameRegex.exec(partialDisposition);
        if (matches != null && matches[2]) {
          fileName = matches[2];
        }
      }
    }
    return fileName;
  }
}
