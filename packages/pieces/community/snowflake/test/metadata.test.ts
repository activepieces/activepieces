import { describe, expect, it, vi } from 'vitest';

vi.mock('snowflake-sdk', async () => (await import('./helpers')).fakeSdk);

import { snowflake } from '../src';

const actions = Object.values(snowflake.actions());
const triggers = Object.values(snowflake.triggers());

describe('piece metadata', () => {
  it('has 14 existing + 30 ai actions and 5 triggers', () => {
    expect(actions).toHaveLength(44);
    expect(actions.filter((a) => a.audience === 'ai')).toHaveLength(30);
    expect(actions.filter((a) => a.audience === 'human')).toHaveLength(11);
    expect(actions.filter((a) => a.audience === 'both')).toHaveLength(3);
    expect(triggers).toHaveLength(5);
  });

  it.each(actions.map((a) => [a.name, a]))('%s declares classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length).toBeGreaterThan(40);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema).toBeDefined();
  });

  it.each(actions.filter((a) => a.audience === 'ai').map((a) => [a.name, a]))('%s has no dynamic or dropdown props', (_name, action) => {
    for (const prop of Object.values(action.props)) {
      expect(['DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC']).not.toContain(prop.type);
    }
  });

  it.each(triggers.map((t) => [t.name, t]))('%s is READ with outputSchema', (_name, trigger) => {
    expect(trigger.classification).toBe('READ');
    expect(trigger.outputSchema).toBeDefined();
    expect(trigger.aiMetadata?.description).toBeTruthy();
  });
});
