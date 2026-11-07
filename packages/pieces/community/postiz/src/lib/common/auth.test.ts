import { AppConnectionType } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';
import { postizAuthHelpers, PostizAuthValue } from './auth';

function connection(props: Record<string, unknown>): PostizAuthValue {
  return { type: AppConnectionType.CUSTOM_AUTH, props } as never;
}

const legacyCloudConnection = connection({
  base_url: 'https://api.postiz.com/public/v1',
  api_key: 'pk_live_123',
});

const legacySelfHostedConnection = connection({
  base_url: 'https://social.example.com/api/public/v1',
  api_key: 'pk_live_123',
});

describe('isJwtAuth', () => {
  it('treats a connection saved before the authType dropdown as API Key', () => {
    expect(postizAuthHelpers.isJwtAuth(legacyCloudConnection)).toBe(false);
    expect(postizAuthHelpers.isJwtAuth(legacySelfHostedConnection)).toBe(false);
  });

  it('follows authType when the connection carries one', () => {
    expect(
      postizAuthHelpers.isJwtAuth(
        connection({
          authType: 'api_key',
          base_url: 'https://api.postiz.com/public/v1',
          api_key: 'pk_live_123',
          email: 'me@example.com',
          password: 'secret',
        })
      )
    ).toBe(false);
    expect(
      postizAuthHelpers.isJwtAuth(
        connection({
          authType: 'jwt',
          base_url: 'https://api.postiz.com/public/v1',
          api_key: 'pk_live_123',
          email: 'me@example.com',
          password: 'secret',
        })
      )
    ).toBe(true);
  });

  it('falls back to the filled fields when authType is missing', () => {
    expect(
      postizAuthHelpers.isJwtAuth(
        connection({
          base_url: 'https://api.postiz.com/public/v1',
          api_key: 'pk_live_123',
          email: 'me@example.com',
          password: 'secret',
        })
      )
    ).toBe(true);
    expect(
      postizAuthHelpers.isJwtAuth(
        connection({
          base_url: 'https://api.postiz.com/public/v1',
          api_key: 'pk_live_123',
          email: 'me@example.com',
        })
      )
    ).toBe(false);
  });
});

describe('publicApiUrl', () => {
  it('keeps the stored base_url untouched', () => {
    expect(postizAuthHelpers.publicApiUrl(legacyCloudConnection)).toBe(
      'https://api.postiz.com/public/v1'
    );
    expect(postizAuthHelpers.publicApiUrl(legacySelfHostedConnection)).toBe(
      'https://social.example.com/api/public/v1'
    );
  });

  it('strips trailing slashes and falls back to Postiz Cloud', () => {
    expect(
      postizAuthHelpers.publicApiUrl(
        connection({ base_url: ' https://api.postiz.com/public/v1// ' })
      )
    ).toBe('https://api.postiz.com/public/v1');
    expect(postizAuthHelpers.publicApiUrl(connection({}))).toBe(
      'https://api.postiz.com/public/v1'
    );
  });
});

describe('instanceApiUrl', () => {
  it('drops the public API suffix to reach the internal API', () => {
    expect(postizAuthHelpers.instanceApiUrl(legacyCloudConnection)).toBe(
      'https://api.postiz.com'
    );
    expect(postizAuthHelpers.instanceApiUrl(legacySelfHostedConnection)).toBe(
      'https://social.example.com/api'
    );
  });
});
