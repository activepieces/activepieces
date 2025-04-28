import { Property, createAction } from '@activepieces/pieces-framework';
import { S3 } from '@aws-sdk/client-s3';
import { blackBlazeS3Auth } from '../..';
import { createBlackBlazeS3 } from '../common';

export const readBlackBlazeFile = createAction({
  auth: blackBlazeS3Auth,
  name: 'read-blackblaze-file',
  displayName: 'Read File',
  description: 'Read a file from black blaze bucket to use it in other steps',
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      description: 'The key of the file to read. include extension if file has any extension.',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth;
    const { key } = context.propsValue;
    const s3 = createBlackBlazeS3(context.auth);

    const file = await s3.getObject({
      Bucket: bucket,
      Key: key,
    });
    const base64 = await file.Body?.transformToString('base64');
    if (!base64) {
      throw new Error(`Could not read file ${key} from bucket`);
    }
    return await context.files.write({
      fileName: key,
      data: Buffer.from(base64, 'base64'),
    });
  },
});
