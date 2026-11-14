import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonS3CombinedAuth, S3AuthProps } from '../auth';
import { resolveS3Client } from '../common';
import { moveFileOutputSchema } from '../output-schemas';

export const moveFile = createAction({
  auth: amazonS3CombinedAuth,
  name: 'moveFile',
  outputSchema: moveFileOutputSchema,
  classification: 'WRITE',
  displayName: 'Move File',
  description: 'Move a file to another folder in your bucket.',
  audience: 'human',
  aiMetadata: {
    description: 'Moves an object within the configured S3 bucket by copying it to a new key under the destination folder (keeping the same filename) and then deleting the original. Use to relocate or archive a file. Not idempotent — the source object is deleted on the first successful run, so a repeat call errors because the source key no longer exists.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'source', display: 'section', label: 'File to Move', icon: 'file', props: ['fileKey'] },
    { key: 'destination', display: 'section', label: 'Destination', icon: 'send', props: ['folderKey'] },
  ],
  props: {
    fileKey: Property.ShortText({
      displayName: 'File Path',
      description: 'Path of the file to move.',
      placeholder: 'old-folder/report.csv',
      required: true,
    }),
    folderKey: Property.ShortText({
      displayName: 'Destination Folder',
      description: 'Folder to move it into. The file keeps its name.',
      placeholder: 'archive/',
      required: true,
    }),
  },
  async run(context) {
    const authProps: S3AuthProps = context.auth.props;
    const { bucket } = authProps;
    const { fileKey, folderKey } = context.propsValue;
    const s3 = await resolveS3Client({ authProps, server: context.server });

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
