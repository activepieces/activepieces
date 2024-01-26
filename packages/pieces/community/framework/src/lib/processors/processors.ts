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
        let contentType: string | null = null;

        if (matches && matches?.length === 3) {
          contentType = matches[1];
          base64 = matches[2];

          // You need to provide how you decide filename and extension in case of base64 string
          const filename = 'unknown';
          const extension = contentType.split('/')[1];

          return new ApFile(
            filename + '.' + extension,
            Buffer.from(base64, 'base64'),
            extension
          );
        }
      }
      const response = await axios.head(urlOrBase64);
      const contentType = response.headers['content-type'];

      console.info(`Content type: ${contentType}`);
      // Check if content type is file
      if (
        !contentType ||
        !(
          contentType.startsWith('application/') ||
          contentType.startsWith('image') ||
          contentType.startsWith('audio') ||
          contentType.startsWith('video') ||
          contentType === 'application/octet-stream'
        )
      ) {
        return null;
      }
      const fileResponse = await axios.get(urlOrBase64, {
        responseType: 'arraybuffer',
      });

      // Get filename and extension
      const filename = urlOrBase64.substring(urlOrBase64.lastIndexOf('/') + 1);
      const extension = filename.split('.').pop();

      // Return the ApFile object
      return new ApFile(
        filename,
        Buffer.from(fileResponse.data, 'binary'),
        extension
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };
}
