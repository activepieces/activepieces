import { Property, createAction } from '@activepieces/pieces-framework';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { amazonS3Auth } from '../auth';

export const generateSignedUploadUrl = createAction({
  auth: amazonS3Auth,
  name: 'generate-signed-upload-url',
  displayName: 'Generate Signed Upload URL',
  description:
    'Generate a pre-signed URL that allows anyone with the link to upload a file directly to S3 without needing AWS credentials.',
  props: {
    key: Property.ShortText({
      displayName: 'File Key',
      description:
        'The destination path and filename inside the bucket, e.g. "uploads/photo.jpg".',
      required: true,
    }),
    expiresIn: Property.Number({
      displayName: 'Expires In (minutes)',
      description: 'How long the upload URL should remain valid (in minutes).',
      required: true,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { bucket, region, accessKeyId, secretAccessKey, endpoint } =
      context.auth.props;
    const { key, expiresIn } = context.propsValue;

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: (expiresIn ?? 10) * 60,
    });

    return {
      url: signedUrl,
    };
  },
});
