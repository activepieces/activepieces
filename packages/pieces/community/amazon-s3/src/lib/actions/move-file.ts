import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonS3Auth } from '../..';
import { createS3 } from '../common';

export const moveFile = createAction({
  auth: amazonS3Auth,
  name: 'moveFile',
  displayName: 'Move File',
  description: 'Move a File to Another Folder',
  props: {
    fileKey: Property.ShortText({
      displayName: 'File Key',
      description: 'The key of the file to move',
      required: true,
    }),
    folderKey: Property.ShortText({
      displayName: 'Folder Key',
      description: 'The key of the folder to move the file to',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth;
    const { fileKey, folderKey } = context.propsValue;
    const s3 = createS3(context.auth);

    const fileName = fileKey.split('/').pop();

    const folderName = folderKey.endsWith('/') ? folderKey.slice(0, -1) :folderKey;

    const newKey = `${folderName}/${fileName}`;

    const copyResponse = await s3.copyObject({
      Bucket: bucket,
      Key: newKey,
      // https://github.com/aws/aws-sdk-js-v3/issues/5475
      CopySource: encodeURIComponent(`${bucket}/${fileKey}`),
    })

    const deleteResponse = await s3.deleteObject({
      Bucket: bucket,
      Key: fileKey
    })

    return copyResponse
  },
});
