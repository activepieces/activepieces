import { Property, createAction } from '@activepieces/pieces-framework';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { amazonS3Auth } from '../..';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const generateSignedUrl = createAction({
  auth: amazonS3Auth,
  name: 'generate-signed-url',
  displayName: 'Generate signed URL',
  description: 'Generate a signed URL for a file in a s3 bucket',
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      description: 'The path/filename of the file to get',
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
  const { bucket, region, accessKeyId, secretAccessKey } = context.auth;
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