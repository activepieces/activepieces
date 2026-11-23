import { describe, expect, it } from 'vitest';
import { azureBlobCommon } from '../src/lib/common/client';

describe('buildTagFilter', () => {
  it('escapes single quotes in values and double-quotes keys', () => {
    const query = azureBlobCommon.buildTagFilter({
      tags: { 'project-id': "O'Brien", status: 'done' },
    });
    expect(query).toBe(`"project-id"='O''Brien' AND "status"='done'`);
  });

  it('neutralises an injection attempt inside the value', () => {
    const query = azureBlobCommon.buildTagFilter({
      tags: { status: 'x\' OR "owner"=\'admin' },
    });
    expect(query).toBe(`"status"='x'' OR "owner"=''admin'`);
  });

  it('escapes double quotes in keys', () => {
    expect(azureBlobCommon.buildTagFilter({ tags: { 'a"b': 'v' } })).toBe(
      `"a""b"='v'`
    );
  });

  it('adds an escaped container condition first', () => {
    expect(
      azureBlobCommon.buildTagFilter({ tags: { k: 'v' }, container: "c'1" })
    ).toBe(`@container='c''1' AND "k"='v'`);
  });

  it('rejects an empty tag set', () => {
    expect(() => azureBlobCommon.buildTagFilter({ tags: {} })).toThrow(
      'at least one tag'
    );
  });
});

describe('validateTags', () => {
  it('accepts text and stringifies numbers and booleans', () => {
    expect(
      azureBlobCommon.validateTags({ tags: { a: 'x', b: 2, c: true } })
    ).toEqual({
      a: 'x',
      b: '2',
      c: 'true',
    });
  });

  it('treats undefined as no tags', () => {
    expect(azureBlobCommon.validateTags({ tags: undefined })).toEqual({});
  });

  it('rejects nested values', () => {
    expect(() =>
      azureBlobCommon.validateTags({ tags: { a: { b: 1 } } })
    ).toThrow('text value');
  });

  it('rejects arrays', () => {
    expect(() => azureBlobCommon.validateTags({ tags: ['a'] })).toThrow(
      'object'
    );
  });

  it('rejects more than 10 tags', () => {
    const tags: Record<string, string> = {};
    for (let index = 0; index < 11; index++) {
      tags[`k${index}`] = 'v';
    }
    expect(() => azureBlobCommon.validateTags({ tags })).toThrow('at most 10');
  });
});

describe('validateTags character set', () => {
  it('rejects a quote in a value with a clear message', () => {
    expect(() =>
      azureBlobCommon.validateTags({ tags: { owner: "O'Brien" } })
    ).toThrow('Tag "owner" has an invalid value');
  });

  it('rejects invalid key characters and lengths', () => {
    expect(() =>
      azureBlobCommon.validateTags({ tags: { 'a#b': 'v' } })
    ).toThrow('Tag key "a#b" is invalid');
    expect(() =>
      azureBlobCommon.validateTags({ tags: { ['k'.repeat(129)]: 'v' } })
    ).toThrow('is invalid');
    expect(() =>
      azureBlobCommon.validateTags({ tags: { k: 'v'.repeat(257) } })
    ).toThrow('invalid value');
  });

  it('accepts every documented character and an empty value', () => {
    const tags = { 'Ab9 +-./:=_': 'Zz0 +-./:=_', empty: '' };
    expect(azureBlobCommon.validateTags({ tags })).toEqual(tags);
  });
});

describe('validateMetadata', () => {
  it('rejects keys that are not C# identifiers', () => {
    expect(() =>
      azureBlobCommon.validateMetadata({ metadata: { 'bad-key': 'v' } })
    ).toThrow('bad-key');
  });
});

describe('mapAzureError', () => {
  it('uses code and first message line, without the raw body', () => {
    const error = Object.assign(
      new Error('The specified blob does not exist.\nRequestId:abc\nTime:x'),
      {
        statusCode: 404,
        code: 'BlobNotFound',
        response: { bodyAsText: '<Error>secret</Error>' },
      }
    );
    const mapped = azureBlobCommon.mapAzureError({
      error,
      operation: 'read blob',
      isWrite: false,
    });
    expect(mapped.message).toBe(
      'Azure Blob read blob failed: BlobNotFound The specified blob does not exist.'
    );
    expect(mapped.message).not.toContain('secret');
  });

  it('says a write may have been applied on transport errors', () => {
    const error = Object.assign(new Error('socket hang up'), {
      code: 'ECONNRESET',
    });
    const mapped = azureBlobCommon.mapAzureError({
      error,
      operation: 'upload blob',
      isWrite: true,
    });
    expect(mapped.message).toBe(
      'Azure Blob upload blob failed: ECONNRESET socket hang up. The change may still have been applied.'
    );
  });

  it('does not add the warning for reads', () => {
    const mapped = azureBlobCommon.mapAzureError({
      error: new Error('timeout'),
      operation: 'list blobs',
      isWrite: false,
    });
    expect(mapped.message).toBe(
      'Azure Blob list blobs failed: network error timeout.'
    );
  });
});

describe('mapAzureError not found', () => {
  it('uses the not-found message for a bodiless 404', () => {
    const error = Object.assign(new Error(''), { statusCode: 404 });
    expect(
      azureBlobCommon.mapAzureError({
        error,
        operation: 'get',
        isWrite: false,
        notFoundMessage: 'blob "b" not found.',
      }).message
    ).toBe('Azure Blob get failed: blob "b" not found.');
  });
});

describe('clampMaxResults', () => {
  it('defaults and bounds', () => {
    expect(
      azureBlobCommon.clampMaxResults({ value: undefined, fallback: 50 })
    ).toBe(50);
    expect(azureBlobCommon.clampMaxResults({ value: 1000, fallback: 50 })).toBe(
      1000
    );
    expect(() =>
      azureBlobCommon.clampMaxResults({ value: 1001, fallback: 50 })
    ).toThrow();
    expect(() =>
      azureBlobCommon.clampMaxResults({ value: 0, fallback: 50 })
    ).toThrow();
  });
});

describe('contentTypeFromName', () => {
  it('maps known extensions case-insensitively and takes the first match', () => {
    expect(azureBlobCommon.contentTypeFromName({ names: ['notes.TXT'] })).toBe(
      'text/plain; charset=utf-8'
    );
    expect(azureBlobCommon.contentTypeFromName({ names: ['photo.jpeg'] })).toBe(
      'image/jpeg'
    );
    expect(
      azureBlobCommon.contentTypeFromName({ names: ['dir/blob', 'upload.csv'] })
    ).toBe('text/csv; charset=utf-8');
  });

  it('falls back to octet-stream', () => {
    expect(
      azureBlobCommon.contentTypeFromName({
        names: ['archive.tar', undefined, 'noext', 'dot.'],
      })
    ).toBe('application/octet-stream');
  });
});

describe('toStringMap', () => {
  it('turns the empty-metadata string into an object', () => {
    expect(azureBlobCommon.toStringMap('')).toEqual({});
    expect(azureBlobCommon.toStringMap(undefined)).toEqual({});
    expect(azureBlobCommon.toStringMap(['a'])).toEqual({});
    expect(azureBlobCommon.toStringMap({ a: '1', b: 2 })).toEqual({ a: '1' });
  });

  it('is applied by the item mappers', () => {
    const blob = azureBlobCommon.mapBlobItem({
      name: 'b',
      deleted: false,
      snapshot: '',
      properties: { lastModified: new Date(0), etag: 'e' },
      metadata: Object.assign(Object.create(null), {}),
    });
    expect(blob.metadata).toEqual({});
    const fromEmptyString = azureBlobCommon.mapContainerItem(
      JSON.parse('{"name":"c","properties":{"etag":"e"},"metadata":""}')
    );
    expect(fromEmptyString.metadata).toEqual({});
  });
});

describe('mapAzureError BlobArchived', () => {
  it('explains rehydration', () => {
    const error = Object.assign(
      new Error('This operation is not permitted on an archived blob.'),
      {
        statusCode: 409,
        code: 'BlobArchived',
      }
    );
    expect(
      azureBlobCommon.mapAzureError({
        error,
        operation: 'read blob',
        isWrite: false,
      }).message
    ).toBe(
      'Azure Blob read blob failed: BlobArchived This operation is not permitted on an archived blob. The blob is in the Archive tier: set the access tier to Hot, Cool or Cold and wait for rehydration (can take hours) before reading.'
    );
  });
});

describe('stripUrlSecrets', () => {
  it('removes the SAS query and fragment', () => {
    expect(
      azureBlobCommon.stripUrlSecrets(
        'https://acct.blob.core.windows.net/c/a%20b.txt?sv=2022&sp=rwdlacupiytfx&sig=SECRET#frag'
      )
    ).toBe('https://acct.blob.core.windows.net/c/a%20b.txt');
  });

  it('cuts at ? even when the URL cannot be parsed', () => {
    expect(azureBlobCommon.stripUrlSecrets('not a url?sig=SECRET')).toBe(
      'not a url'
    );
  });

  it('item mappers never return a URL or signature', () => {
    const blob = azureBlobCommon.mapBlobItem({
      name: 'b',
      deleted: false,
      snapshot: '',
      properties: { lastModified: new Date(0), etag: 'e' },
    });
    const container = azureBlobCommon.mapContainerItem({
      name: 'c',
      properties: { lastModified: new Date(0), etag: 'e' },
    });
    expect(JSON.stringify([blob, container])).not.toMatch(/sig=|https?:/);
  });
});

describe('mapAzureError SAS redaction', () => {
  it('never repeats a SAS signature from the SDK message', () => {
    const error = azureBlobCommon.mapAzureError({
      operation: 'copy blob',
      isWrite: true,
      error: {
        statusCode: 403,
        code: 'CannotVerifyCopySource',
        message:
          'Copy source https://a.blob.core.windows.net/c/b?sv=2024&sp=r&sig=SECRET123%3D failed',
      },
    });
    expect(error.message).not.toContain('SECRET123');
    expect(error.message).toContain('sig=REDACTED');
  });
});

describe('mapAzureError permission hint', () => {
  it('explains a read-only SAS on a write', () => {
    const error = azureBlobCommon.mapAzureError({
      operation: 'upload blob',
      isWrite: true,
      error: {
        statusCode: 403,
        code: 'AuthorizationPermissionMismatch',
        message:
          'This request is not authorized to perform this operation using this permission.',
      },
    });
    expect(error.message).toContain('AuthorizationPermissionMismatch');
    expect(error.message).toContain('account-key connection string');
  });
});
