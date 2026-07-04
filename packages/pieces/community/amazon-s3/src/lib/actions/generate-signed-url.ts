import { Property, ServerContext, createAction } from '@activepieces/pieces-framework';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { amazonS3CombinedAuth, AccessKeyAuthProps, OidcAuthProps, S3AuthProps } from '../auth';
import { createS3, createS3WithAssumeRole, isOidcAuth, MAX_STS_DURATION_SECONDS, MIN_STS_DURATION_SECONDS } from '../common';

export const generateSignedUrl = createAction({
  auth: amazonS3CombinedAuth,
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
    const authProps: S3AuthProps = context.auth.props;
    const { key, expiresIn } = context.propsValue;

    const clientUrl = isOidcAuth(authProps)
      ? await createPresignedUrlWithAssumeRole({ auth: authProps, server: context.server, key, expiresIn })
      : await createPresignedUrlWithClient({ auth: authProps, key, expiresIn });

    return clientUrl;
  },
});

async function createPresignedUrlWithAssumeRole({
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
  const expiresInSeconds = expiresIn * 60;
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
  const command = new GetObjectCommand({ Bucket: auth.bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

function createPresignedUrlWithClient({
  auth,
  key,
  expiresIn,
}: {
  auth: AccessKeyAuthProps;
  key: string;
  expiresIn: number;
}) {
  const s3 = createS3(auth);
  const command = new GetObjectCommand({ Bucket: auth.bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresIn * 60 });
}
