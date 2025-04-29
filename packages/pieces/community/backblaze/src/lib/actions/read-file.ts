import { Property, createAction } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../..';
import { createBackBlazeS3 } from '../common';

export const readBackBlazeFileAction = createAction({
  auth: backBlazeS3Auth,
  name: 'read-backblaze-file',
  displayName: 'Read File',
  description: 'Read a file from Backblaze bucket to use it in other steps.',
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
    const s3 = createBackBlazeS3(context.auth);

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
