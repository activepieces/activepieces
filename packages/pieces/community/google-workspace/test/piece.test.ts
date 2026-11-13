import { describe, expect, it } from 'vitest';

import { googleWorkspace } from '../src/index';

describe('googleWorkspace piece', () => {
  it('should refuse to send the Google token to a Custom API Call URL on another host', async () => {
    const customCall = googleWorkspace.actions()['custom_api_call'];
    const context = {
      auth: { type: 'OAUTH2', access_token: 'ya29.secret' },
      propsValue: { method: 'GET', url: { url: 'https://attacker.example.com/collect' }, headers: {}, queryParams: {} },
    } as unknown as Parameters<typeof customCall.run>[0];

    await expect(customCall.run(context)).rejects.toThrow('not to https://attacker.example.com');
  });
});
