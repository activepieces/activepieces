import { describe, expect, it } from 'vitest';

import { googleAds } from '../src/index';

describe('googleAds piece', () => {
  it('should expose the display name the builder shows', () => {
    expect(googleAds.displayName).toBe('Google Ads');
  });

  it('should register every action under a unique name', () => {
    const names = Object.keys(googleAds.actions());

    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should tag every action and trigger with AI metadata and a classification', () => {
    const actions = Object.values(googleAds.actions()).filter((action) => action.name !== 'custom_api_call');
    const triggers = Object.values(googleAds.triggers());

    for (const action of actions) {
      expect(action.audience, action.name).toBe('both');
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.outputSchema, action.name).toBeDefined();
    }
    for (const trigger of triggers) {
      expect(trigger.classification, trigger.name).toBe('READ');
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
    }
  });
});
