import { Property, createAction } from '@activepieces/pieces-framework';
import { S3 } from '@aws-sdk/client-s3';
import { amazonS3Auth } from '../..';
import { createS3 } from '../common';

export const deleteFile = createAction({
  auth: amazonS3Auth,
  name: 'deleteFile',
  displayName: 'Delete File',
  description: 'Delete a file',
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

    const response =  await s3.deleteObject({
      Bucket: bucket,
      Key: key,
    });

    return response
  },
});
