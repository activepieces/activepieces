import { describe, expect, it } from 'vitest';
import { backblazeCommon } from '../src/lib/common';

describe('resolveEndpoint', () => {
  it('derives the B2 endpoint from a B2 region when blank', () => {
    expect(backblazeCommon.resolveEndpoint({ endpoint: '', region: 'us-west-004' })).toBe(
      'https://s3.us-west-004.backblazeb2.com',
    );
  });
  it('keeps AWS regions without an endpoint unchanged', () => {
    expect(backblazeCommon.resolveEndpoint({ endpoint: undefined, region: 'us-east-1' })).toBeUndefined();
  });
  it('adds a scheme and strips the trailing slash', () => {
    expect(
      backblazeCommon.resolveEndpoint({ endpoint: 's3.eu-central-003.backblazeb2.com/', region: 'us-east-1' }),
    ).toBe('https://s3.eu-central-003.backblazeb2.com');
  });
  it('strips a bucket host prefix', () => {
    expect(
      backblazeCommon.resolveEndpoint({
        endpoint: 'https://my-bucket.s3.us-west-002.backblazeb2.com',
        region: 'us-east-1',
        bucket: 'my-bucket',
      }),
    ).toBe('https://s3.us-west-002.backblazeb2.com');
  });
});

describe('resolveRegion', () => {
  it('reads the region from a B2 endpoint', () => {
    expect(
      backblazeCommon.resolveRegion({ region: 'us-east-1', endpoint: 'https://s3.us-west-004.backblazeb2.com' }),
    ).toBe('us-west-004');
  });
});

describe('publicFileUrl', () => {
  it('builds a path-style URL with an encoded key', () => {
    expect(
      backblazeCommon.publicFileUrl({
        auth: { accessKeyId: 'a', secretAccessKey: 'b', bucket: 'bk', region: 'us-west-004', endpoint: '' },
        key: 'dir/a b.pdf',
      }),
    ).toBe('https://s3.us-west-004.backblazeb2.com/bk/dir/a%20b.pdf');
  });
});

describe('describeValidationError', () => {
  it('separates auth from bucket errors', () => {
    const auth = backblazeCommon.describeValidationError({
      name: 'SignatureDoesNotMatch',
      message: 'bad',
      $metadata: { httpStatusCode: 403 },
    });
    const bucket = backblazeCommon.describeValidationError({
      name: 'NoSuchBucket',
      message: 'gone',
      $metadata: { httpStatusCode: 404 },
    });
    expect(auth).toContain('credentials');
    expect(bucket).toContain('bucket was not found');
  });

  it('points an unknown key ID at the key type and region', () => {
    const unknownKey = backblazeCommon.describeValidationError({
      name: 'InvalidAccessKeyId',
      message: 'bad',
      $metadata: { httpStatusCode: 403 },
    });
    expect(unknownKey).toContain('Region');
    expect(unknownKey).toContain('not the master key');
  });
  it('reports network errors', () => {
    expect(
      backblazeCommon.describeValidationError({ name: 'Error', message: 'getaddrinfo ENOTFOUND x', code: 'ENOTFOUND' }),
    ).toContain('Could not reach');
  });
});
