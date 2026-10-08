import { describe, expect, test } from 'vitest';
import { bika } from '../src';

const actions = Object.values(bika.actions());
const nonCustom = actions.filter((action) => action.name !== 'custom_api_call');

describe('piece metadata', () => {
  test('13 actions plus custom API call, no triggers', () => {
    expect(nonCustom).toHaveLength(13);
    expect(actions).toHaveLength(14);
    expect(Object.keys(bika.triggers())).toHaveLength(0);
  });

  test('legacy action names are kept and are human-only', () => {
    for (const name of ['bika_create_record', 'bika_update_record', 'bika_delete_record', 'bika_find_record', 'bika_find_records']) {
      const action = nonCustom.find((item) => item.name === name);
      expect(action?.audience, name).toBe('human');
    }
  });

  test('audience split is 5 human, 7 ai, 1 both', () => {
    const count = (audience: string) => nonCustom.filter((action) => action.audience === audience).length;
    expect([count('human'), count('ai'), count('both')]).toEqual([5, 7, 1]);
  });

  test.each(nonCustom.map((action) => [action.name, action]))('%s declares classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(60);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });

  test('actions visible to agents use no dropdowns', () => {
    for (const action of nonCustom.filter((item) => item.audience !== 'human')) {
      const types = Object.values(action.props).map((prop: unknown) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
      expect(types, action.name).not.toContain('DROPDOWN');
      expect(types, action.name).not.toContain('DYNAMIC');
    }
  });

  test('deletes are destructive and not idempotent', () => {
    const destructive = nonCustom.filter((action) => action.classification === 'DESTRUCTIVE');
    expect(destructive.map((action) => action.name).sort()).toEqual(['bika_delete_record', 'delete_record_by_id']);
    for (const action of destructive) {
      expect(action.aiMetadata?.idempotent).toBe(false);
    }
  });
});
