import { describe, expect, it } from 'vitest';

import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework';

import { ringcentral } from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta = (): any => ringcentral.metadata();

describe('piece metadata', () => {
  it('declares the expected surface', () => {
    const m = meta();
    expect(m.displayName).toBe('RingCentral');
    expect(Object.keys(m.actions)).toHaveLength(8);
    expect(Object.keys(m.triggers)).toHaveLength(3);
  });

  it('exposes every action and trigger by name', () => {
    expect(Object.keys(meta().actions).sort()).toEqual([
      'custom_api_call',
      'download_message_attachment',
      'get_call_log',
      'get_extension_info',
      'get_message',
      'make_call',
      'send_sms',
      'send_team_message',
    ]);
    expect(Object.keys(meta().triggers).sort()).toEqual([
      'new_inbound_sms',
      'new_team_message',
      'new_voicemail',
    ]);
  });

  it('points the logo at the pieces CDN', () => {
    expect(meta().logoUrl).toBe('https://cdn.activepieces.com/pieces/ringcentral.png');
  });

  it('authenticates the token exchange with a Basic header', () => {
    // The framework defaults to client creds in the request body, which RingCentral's token endpoint
    // answers with OAU-123 "Client authentication is required" before it even looks at the grant.
    // Refresh reads the same stored method, so BODY breaks reconnects too.
    expect(meta().auth.authorizationMethod).toBe(OAuth2AuthorizationMethod.HEADER);
  });

  it('opts out of the platform-appended consent prompt', () => {
    // oauth2-util appends prompt=consent to every authorize URL unless the piece opts out.
    // RingCentral's login dispatcher reads it as a request for SSO-only sign-in and dead-ends with
    // API_ERROR_208 on accounts without SAML, so no connection can be completed at all.
    expect(meta().auth.prompt).toBe('omit');
  });

  it('lists its authors', () => {
    expect(meta().authors).toEqual(['alexandronic']);
  });

  it('declares a minimum supported release', () => {
    // createPiece may clamp the declared floor upward, so assert shape, not the exact value.
    expect(meta().minimumSupportedRelease).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
