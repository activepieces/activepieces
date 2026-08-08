import { describe, expect, it } from 'vitest';

import { ringcentral } from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta = (): any => ringcentral.metadata();

describe('piece metadata', () => {
  it('declares the expected surface', () => {
    const m = meta();
    expect(m.displayName).toBe('RingCentral');
    expect(Object.keys(m.actions)).toHaveLength(6);
    expect(Object.keys(m.triggers)).toHaveLength(3);
  });

  it('exposes every action and trigger by name', () => {
    expect(Object.keys(meta().actions).sort()).toEqual([
      'custom_api_call',
      'get_call_log',
      'get_extension_info',
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

  it('lists its authors', () => {
    expect(meta().authors).toEqual(['alexandronic']);
  });

  it('declares a minimum supported release', () => {
    // createPiece may clamp the declared floor upward, so assert shape, not the exact value.
    expect(meta().minimumSupportedRelease).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
