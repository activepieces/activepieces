import { Property, createAction } from '@activepieces/pieces-framework';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { amazonS3Auth } from '../auth';
import { createS3 } from '../common';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const generateSignedUrl = createAction({
  auth: amazonS3Auth,
  name: 'generate-signed-url',
  displayName: 'Generate signed URL',
  description: 'Generate a signed URL for a file in a s3 bucket',
  props: {
    key: Property.ShortText({
      displayName: 'File Path',
      description: 'The full path to the file within your S3 bucket (e.g. "documents/report.csv" or "myfile.txt"). This is also called the S3 "key".',
      required: true,
    }),
    expiresIn: Property.Number({
      displayName: 'Expires In (minutes)',
      description: 'How long the URL should remain valid (in minutes).',
      required: true,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { key, expiresIn } = context.propsValue;

    const client = await createS3(context.auth.props);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: expiresIn * 60 });
  },
});
