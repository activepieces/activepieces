import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonS3Auth } from '../auth';
import { createS3 } from '../common';

export const moveFile = createAction({
  auth: amazonS3Auth,
  name: 'moveFile',
  displayName: 'Move File',
  description: 'Move a File to Another Folder',
  props: {
    fileKey: Property.ShortText({
      displayName: 'File Path',
      description: 'The full path to the file you want to move (e.g. "old-folder/report.csv").',
      required: true,
    }),
    folderKey: Property.ShortText({
      displayName: 'Destination Folder',
      description: 'The folder path to move the file into (e.g. "archive/" or "new-folder"). The file name is kept the same.',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { fileKey, folderKey } = context.propsValue;
    const s3 = createS3(context.auth.props);

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
