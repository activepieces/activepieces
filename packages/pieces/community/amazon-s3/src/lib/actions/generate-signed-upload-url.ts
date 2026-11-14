import { MarkdownVariant, Property, ServerContext, createAction } from '@activepieces/pieces-framework';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { amazonS3CombinedAuth, AccessKeyAuthProps, OidcAuthProps, S3AuthProps } from '../auth';
import { createS3, createS3WithAssumeRole, isOidcAuth, MAX_STS_DURATION_SECONDS, MIN_STS_DURATION_SECONDS } from '../common';
import { generateSignedUploadUrlOutputSchema } from '../output-schemas';

export const generateSignedUploadUrl = createAction({
  auth: amazonS3CombinedAuth,
  name: 'generate-signed-upload-url',
  outputSchema: generateSignedUploadUrlOutputSchema,
  classification: 'READ',
  displayName: 'Generate Signed Upload URL',
  description: 'Create a temporary link anyone can use to upload a file.',
  audience: 'both',
  aiMetadata: {
    description: 'Generates a time-limited pre-signed upload (PUT) URL for a target key in the configured S3 bucket, letting anyone with the link upload a file directly to S3 without AWS credentials until it expires. Use to delegate an upload to an external client. Generating the URL does not itself create or modify any object and is idempotent (each call returns a freshly signed URL).',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Destination', icon: 'file', props: ['key'] },
    { key: 'link', display: 'section', label: 'Link', icon: 'sliders', props: ['linkInfo', 'expiresIn'] },
  ],
  props: {
    key: Property.ShortText({
      displayName: 'File Path',
      description: 'Where the uploaded file will be saved in the bucket.',
      placeholder: 'uploads/photo.jpg',
      required: true,
    }),
    linkInfo: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: 'Links last at most 7 days, or 12 hours with an IAM Role / OIDC connection.',
    }),
    expiresIn: Property.Number({
      displayName: 'Expires In',
      description: 'Minutes until the link stops working.',
      required: true,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 10080,
      step: 1,
    }),
  },
  async run(context) {
    const authProps: S3AuthProps = context.auth.props;
    const { key, expiresIn } = context.propsValue;

    const signedUrl = isOidcAuth(authProps)
      ? await createUploadUrlWithAssumeRole({ auth: authProps, server: context.server, key, expiresIn })
      : await createUploadUrlWithClient({ auth: authProps, key, expiresIn });

    return {
      url: signedUrl,
    };
  },
});

async function createUploadUrlWithAssumeRole({
  auth,
  server,
  key,
  expiresIn,
}: {
  auth: OidcAuthProps;
  server: ServerContext;
  key: string;
  expiresIn: number;
}) {
  const expiresInSeconds = (expiresIn ?? 10) * 60;
  // A URL signed with temporary STS credentials stops working once the session expires,
  // so the session must outlast the requested URL validity — and STS caps web-identity
  // sessions at 12h. Beyond that the URL would die silently before its stated expiry.
  if (expiresInSeconds > MAX_STS_DURATION_SECONDS) {
    throw new Error(
      `IAM Role (OIDC) signed URLs can be valid for at most ${MAX_STS_DURATION_SECONDS / 60} minutes (12 hours). Reduce "Expires In", or use Access Key authentication for longer-lived URLs.`,
    );
  }
  const durationSeconds = Math.max(expiresInSeconds, MIN_STS_DURATION_SECONDS);
  const s3 = await createS3WithAssumeRole({ auth, server, durationSeconds });
  const command = new PutObjectCommand({ Bucket: auth.bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

function createUploadUrlWithClient({
  auth,
  key,
  expiresIn,
}: {
  auth: AccessKeyAuthProps;
  key: string;
  expiresIn: number;
}) {
  const s3 = createS3(auth);
  const command = new PutObjectCommand({ Bucket: auth.bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: (expiresIn ?? 10) * 60 });
}
