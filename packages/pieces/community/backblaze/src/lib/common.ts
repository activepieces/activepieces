import { S3 } from '@aws-sdk/client-s3';

function isB2Region(region: string | undefined): boolean {
  return !!region && B2_REGION_PATTERN.test(region);
}

function resolveEndpoint({
  endpoint,
  region,
  bucket,
}: {
  endpoint: string | undefined;
  region: string | undefined;
  bucket?: string;
}): string | undefined {
  const trimmed = (endpoint ?? '').trim();
  if (trimmed === '') {
    return isB2Region(region) ? `https://s3.${region}.backblazeb2.com` : undefined;
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const withoutSlash = withScheme.replace(/\/+$/, '');
  if (!bucket) {
    return withoutSlash;
  }
  const bucketPrefix = `://${bucket.toLowerCase()}.`;
  const index = withoutSlash.toLowerCase().indexOf(bucketPrefix);
  if (index === -1 || !withoutSlash.toLowerCase().includes('.backblazeb2.com')) {
    return withoutSlash;
  }
  return withoutSlash.slice(0, index + 3) + withoutSlash.slice(index + bucketPrefix.length);
}

function resolveRegion({
  region,
  endpoint,
}: {
  region: string | undefined;
  endpoint: string | undefined;
}): string | undefined {
  if (isB2Region(region)) {
    return region;
  }
  const match = endpoint ? /s3\.([a-z]+-[a-z]+-\d{3})\.backblazeb2\.com/i.exec(endpoint) : null;
  return match ? match[1].toLowerCase() : region;
}

function createBackBlazeS3(auth: BackBlazeAuthProps): S3 {
  const endpoint = resolveEndpoint({
    endpoint: auth.endpoint,
    region: auth.region,
    bucket: auth.bucket,
  });
  return new S3({
    credentials: {
      accessKeyId: auth.accessKeyId.trim(),
      secretAccessKey: auth.secretAccessKey.trim(),
    },
    forcePathStyle: endpoint ? true : undefined,
    region: resolveRegion({ region: auth.region, endpoint }),
    endpoint,
  });
}

function publicFileUrl({
  auth,
  key,
}: {
  auth: BackBlazeAuthProps;
  key: string;
}): string | null {
  const endpoint = resolveEndpoint({
    endpoint: auth.endpoint,
    region: auth.region,
    bucket: auth.bucket,
  });
  if (!endpoint) {
    return null;
  }
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${endpoint}/${encodeURIComponent(auth.bucket)}/${encodedKey}`;
}

function readSdkError(error: unknown): SdkErrorInfo {
  if (typeof error !== 'object' || error === null) {
    return { name: 'Error', message: String(error), status: undefined, code: undefined };
  }
  const name = 'name' in error && typeof error.name === 'string' ? error.name : 'Error';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const metadata = '$metadata' in error ? error.$metadata : undefined;
  const status =
    typeof metadata === 'object' &&
    metadata !== null &&
    'httpStatusCode' in metadata &&
    typeof metadata.httpStatusCode === 'number'
      ? metadata.httpStatusCode
      : undefined;
  return { name, message, status, code };
}

function describeValidationError(error: unknown): string {
  const { name, message, status, code } = readSdkError(error);
  const detail = `${name}${message ? `: ${message}` : ''}`;
  if (name === 'NoSuchBucket' || name === 'InvalidBucketName') {
    return `The bucket was not found at this endpoint. Check the bucket name and that the endpoint/region matches the bucket's region (${detail}).`;
  }
  if (
    status === 401 ||
    status === 403 ||
    name === 'InvalidAccessKeyId' ||
    name === 'SignatureDoesNotMatch' ||
    name === 'AccessDenied'
  ) {
    if (name === 'InvalidAccessKeyId') {
      return `Backblaze did not recognise the Application Key ID at this endpoint. Check the Key ID (an application key, not the master key) and that the Region matches the endpoint shown on your bucket (${detail}).`;
    }
    return `Backblaze rejected the credentials or the key has no access to this bucket. Check the Application Key ID, the Application Key and the key's bucket restriction (${detail}).`;
  }
  if (
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    name === 'TimeoutError' ||
    /ENOTFOUND|ECONNREFUSED|getaddrinfo/.test(message)
  ) {
    return `Could not reach the endpoint. Check the S3 endpoint, e.g. s3.us-west-004.backblazeb2.com (${detail}).`;
  }
  return `Backblaze returned an error (${detail}).`;
}

type SdkErrorInfo = {
  name: string;
  message: string;
  status: number | undefined;
  code: string | undefined;
};

const B2_REGION_PATTERN = /^[a-z]+-[a-z]+-\d{3}$/;

export const B2_REGIONS = [
  'us-west-001',
  'us-west-002',
  'us-west-004',
  'us-east-005',
  'eu-central-003',
  'ca-east-006',
];

export type BackBlazeAuthProps = {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string | undefined;
  endpoint: string | undefined;
};

export const backblazeCommon = {
  createBackBlazeS3,
  resolveEndpoint,
  resolveRegion,
  isB2Region,
  publicFileUrl,
  readSdkError,
  describeValidationError,
};
