import { Readable } from 'node:stream';
import { Property, createAction } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../..';
import { backblazeCommon } from '../common';
import { backblazeAiCommon } from './ai/ai-common';

export const readBackBlazeFileAction = createAction({
  auth: backBlazeS3Auth,
  name: 'read-backblaze-file',
  classification: 'READ',
  displayName: 'Read File',
  description: 'Read a file from Backblaze bucket to use it in other steps.',
  audience: 'human',
  aiMetadata: { description: 'Fetches an object from the configured Backblaze B2 (S3-compatible) bucket by its key and writes it to a downstream file reference for use in later steps. Use to retrieve previously stored file content. Requires the exact object key including any extension. Idempotent: it only reads, leaving the bucket unchanged.', idempotent: true },
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      description: 'The key of the file to read. include extension if file has any extension.',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { key } = context.propsValue;
    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);

    const file = await backblazeAiCommon.call({
      operation: 'read file',
      key,
      request: () => s3.getObject({ Bucket: bucket, Key: key }),
    });
    const body = file.Body;
    if (!(body instanceof Readable)) {
      throw new Error(`Backblaze read file: could not read "${key}" from the bucket.`);
    }
    return await context.files.write({
      fileName: key,
      data: body,
    });
  },
});
