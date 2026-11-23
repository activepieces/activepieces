import { Readable } from 'node:stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../../..';
import { backblazeCommon } from '../../common';
import { backblazeReadFileAiOutputSchema } from '../../output-schemas';
import { backblazeAiCommon } from './ai-common';

export const backblazeReadFileAi = createAction({
  auth: backBlazeS3Auth,
  name: 'backblaze_read_file',
  outputSchema: backblazeReadFileAiOutputSchema,
  displayName: 'Read File',
  description: 'Reads a file, returning text content inline and the file itself for later steps.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads one file from the connected Backblaze B2 bucket by exact key and returns it as a stored file in "file". For text files (text/*, JSON, CSV, XML, YAML, Markdown) it also returns the UTF-8 text in "content"; a text file over 1 MB is rejected with an error, use Get File Metadata to check the size first. Binary files return content null and only the file.',
    idempotent: true,
  },
  props: {
    key: Property.ShortText({
      displayName: 'File Key',
      description: 'The full key (path) of the file, e.g. "reports/2024/q1.csv", as returned by List Files.',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { key } = context.propsValue;
    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);
    const response = await backblazeAiCommon.call({
      operation: 'read file',
      key,
      request: () => s3.getObject({ Bucket: bucket, Key: key }),
    });
    const body = response.Body;
    if (!body) {
      throw new Error(`Backblaze read file: "${key}" returned no content.`);
    }
    const size = response.ContentLength ?? null;
    const contentType = response.ContentType ?? null;
    const fileName = key.split('/').pop() || key;
    if (!backblazeAiCommon.isTextContentType(response.ContentType)) {
      if (!(body instanceof Readable)) {
        throw new Error(`Backblaze read file: could not stream "${key}".`);
      }
      const file = await context.files.write({ fileName, data: body });
      return { key, contentType, size, content: null, file };
    }
    if (size !== null && size > MAX_INLINE_BYTES) {
      if (body instanceof Readable) {
        body.destroy();
      }
      throw new Error(
        `Backblaze read file: "${key}" is ${size} bytes, over the 1 MB limit for inline text. Use Get File Metadata to check sizes first.`,
      );
    }
    const bytes = Buffer.from(await body.transformToByteArray());
    if (bytes.length > MAX_INLINE_BYTES) {
      throw new Error(`Backblaze read file: "${key}" is over the 1 MB limit for inline text.`);
    }
    const file = await context.files.write({ fileName, data: bytes });
    return { key, contentType, size: size ?? bytes.length, content: bytes.toString('utf8'), file };
  },
});

const MAX_INLINE_BYTES = 1024 * 1024;
