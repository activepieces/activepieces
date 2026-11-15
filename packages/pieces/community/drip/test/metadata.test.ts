import { describe, expect, test } from 'vitest';
import { drip } from '../src';

const actions = Object.values(drip.actions());
const nonCustom = actions.filter((action) => action.name !== 'custom_api_call');
const byName = Object.fromEntries(actions.map((action) => [action.name, action]));

describe('piece metadata', () => {
  test('36 actions and 10 triggers', () => {
    expect(actions).toHaveLength(36);
    expect(Object.keys(drip.triggers())).toHaveLength(10);
  });
  test.each(nonCustom.map((action) => [action.name, action]))('%s declares audience, classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['both', 'ai', 'human']).toContain(action.audience);
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(60);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });
  test('dropdown actions are human-only and AI-visible actions have no dropdowns', () => {
    for (const name of ['add_subscriber_to_campaign', 'apply_tag_to_subscriber', 'upsert_subscriber']) {
      expect(byName[name].audience).toBe('human');
    }
    for (const name of ['subscribe_to_campaign', 'apply_tag', 'create_or_update_subscriber']) {
      expect(byName[name].audience).toBe('ai');
    }
    const aiVisible = actions.filter((action) => action.audience !== 'human' && action.name !== 'custom_api_call');
    for (const action of aiVisible) {
      const types = Object.values(action.props).map((prop: unknown) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
      expect(types).not.toContain('DROPDOWN');
    }
  });
  test('delete_subscriber and unsubscribe_subscriber (dedicated unsubscribe, rubric wave-15) are destructive; non-idempotent writes are the ones that start or record things', () => {
    expect(nonCustom.filter((action) => action.classification === 'DESTRUCTIVE').map((action) => action.name).sort()).toEqual(['delete_subscriber', 'unsubscribe_subscriber']);
    expect(
      nonCustom
        .filter((action) => action.aiMetadata?.idempotent === false)
        .map((action) => action.name)
        .sort(),
    ).toEqual(['add_subscriber_to_campaign', 'record_cart', 'record_event', 'record_order', 'start_workflow', 'subscribe_to_campaign']);
  });
  test('triggers are READ with aiMetadata, sample data and an output schema', () => {
    for (const trigger of Object.values(drip.triggers())) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
      expect(trigger.sampleData).toBeTruthy();
      expect(trigger.outputSchema?.fields.length).toBeGreaterThan(0);
    }
  });
  test('minimum release supports ai audience', () => {
    expect(drip.minimumSupportedRelease).toBe('0.88.2');
  });
});
