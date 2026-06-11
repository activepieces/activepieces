import { Property, createAction } from '@activepieces/pieces-framework';
import { amazonS3Auth } from '../auth';
import { createS3 } from '../common';

export const deleteFile = createAction({
  auth: amazonS3Auth,
  name: 'deleteFile',
  displayName: 'Delete File',
  description: 'Deletes an existing file.',
  audience: 'both',
  aiMetadata: {
    description: 'Deletes a single object from the configured S3 bucket by its full key (path). Use to remove a known file. Idempotent: deleting an already-absent key succeeds without error, so repeating the call has no further effect.',
    idempotent: true,
  },
  props: {
    key: Property.ShortText({
      displayName: 'File Path',
      description: 'The full path to the file within your S3 bucket (e.g. "documents/report.csv" or "myfile.txt"). This is also called the S3 "key".',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props
    const { key } = context.propsValue;

    const s3 = createS3(context.auth.props);

    const response = await s3.deleteObject({
      Bucket: bucket,
      Key: key,
    });

    return response
  },
});
