import { describe, expect, it } from 'vitest';

import { googleWorkspace } from '../src/index';

describe('googleWorkspace piece', () => {
  it('should expose the display name the builder shows', () => {
    expect(googleWorkspace.displayName).toBe('Google Workspace');
  });

  it('should register the nine actions of the card under unique names', () => {
    const names = Object.keys(googleWorkspace.actions());

    expect(names).toEqual([
      'addRecord',
      'updateRecord',
      'deleteRecord',
      'getRecord',
      'searchRecords',
      'suspendUser',
      'mobileDeviceAction',
      'transferData',
      'custom_api_call',
    ]);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should register the three activity triggers', () => {
    expect(Object.keys(googleWorkspace.triggers())).toEqual(['newAdminActivityEvent', 'newApplicationActivityEvent', 'newUserEvent']);
  });

  it('should offer both connection methods: OAuth2 and service account', () => {
    const methods = googleWorkspace.auth as { type: string; displayName: string }[];

    expect(methods.map((m) => m.type)).toEqual(['OAUTH2', 'CUSTOM_AUTH']);
    expect(methods.map((m) => m.displayName)).toEqual(['Google Account (OAuth2)', 'Service Account (Domain-Wide Delegation)']);
  });

  it('should point the logo at the Activepieces CDN', () => {
    expect(googleWorkspace.logoUrl).toBe('https://cdn.activepieces.com/pieces/google-workspace.png');
  });

  it('should tag every hand-written action with audience, classification and AI metadata', () => {
    const actions = Object.values(googleWorkspace.actions()).filter((action) => action.name !== 'custom_api_call');

    for (const action of actions) {
      expect(action.audience).toBe('both');
      expect(action.classification).toBeDefined();
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
    }
  });

  it('should tag every trigger as READ with an AI description and an output schema', () => {
    for (const trigger of Object.values(googleWorkspace.triggers())) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description).toBeTruthy();
      expect(trigger.outputSchema?.fields.length).toBeGreaterThan(0);
    }
  });

  it('should refuse to send the Google token to a Custom API Call URL on another host', async () => {
    const customCall = googleWorkspace.actions()['custom_api_call'];
    const context = {
      auth: { type: 'OAUTH2', access_token: 'ya29.secret' },
      propsValue: { method: 'GET', url: { url: 'https://attacker.example.com/collect' }, headers: {}, queryParams: {} },
    } as unknown as Parameters<typeof customCall.run>[0];

    await expect(customCall.run(context)).rejects.toThrow('not to https://attacker.example.com');
  });
});
