import { Property, createAction } from '@activepieces/pieces-framework';
import { S3 } from '@aws-sdk/client-s3';
import { amazonS3Auth } from '../..';
import { createS3 } from '../common';

export const readFile = createAction({
  auth: amazonS3Auth,
  name: 'read-file',
  displayName: 'Read File',
  description: 'Read a file from S3 to use it in other steps',
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      description: 'The key of the file to read',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth;
    const { key } = context.propsValue;
    const s3 = createS3(context.auth);

    const file = await s3.getObject({
      Bucket: bucket,
      Key: key,
    });
    const base64 = await file.Body?.transformToString('base64');
    if (!base64) {
      throw new Error(`Could not read file ${key} from S3`);
    }
    return await context.files.write({
      fileName: key,
      data: Buffer.from(base64, 'base64'),
    });
  },
});
