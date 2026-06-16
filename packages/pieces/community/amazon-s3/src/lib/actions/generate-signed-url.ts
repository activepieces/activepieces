import { Property, createAction } from '@activepieces/pieces-framework';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { amazonS3Auth } from '../auth';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const generateSignedUrl = createAction({
  auth: amazonS3Auth,
  name: 'generate-signed-url',
  displayName: 'Generate signed URL',
  description: 'Generate a signed URL for a file in a s3 bucket',
  audience: 'both',
  aiMetadata: {
    description: 'Generates a time-limited pre-signed download (GET) URL for an existing object in the configured S3 bucket, letting anyone with the link fetch the file without AWS credentials until it expires. Use when you need to share read access to a stored file. Read-only and idempotent (no object is modified), though each call returns a freshly signed URL.',
    idempotent: true,
  },
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
  const { bucket, region, accessKeyId, secretAccessKey } = context.auth.props;
  const { key, expiresIn } = context.propsValue;

  const clientUrl = await createPresignedUrlWithClient({
    region,
    bucket,
    key,
    accessKeyId,
    secretAccessKey,
    expiresIn
  });

    return clientUrl
  },
});

const createPresignedUrlWithClient = ({ region, bucket, key, accessKeyId, secretAccessKey, expiresIn }: any) => {
   const client = new S3Client({ 
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresIn * 60 });
};