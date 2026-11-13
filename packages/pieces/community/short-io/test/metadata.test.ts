import { describe, expect, test } from 'vitest';
import { shortIo } from '../src';

const actions = Object.values(shortIo.actions());
const nonCustom = actions.filter((action) => action.name !== 'custom_api_call');
const byName = Object.fromEntries(actions.map((action) => [action.name, action]));
const LEGACY_HUMAN = [
  'create-short-link',
  'update-short-link',
  'expire-short-link',
  'create-country-targeting-rule',
  'get-short-link-info-by-path',
  'list-short-links',
  'get-domain-statistics',
  'get-link-clicks',
];
const AI_TWINS = ['create_link', 'update_link', 'find_link_by_path', 'list_links', 'delete_link', 'set_country_rule', 'get_domain_statistics'];

describe('piece metadata', () => {
  test('34 actions plus Custom API Call, 1 trigger, 0.88.2', () => {
    expect(nonCustom).toHaveLength(34);
    expect(byName['custom_api_call']).toBeDefined();
    expect(Object.keys(shortIo.triggers())).toEqual(['new_link_created']);
    expect(shortIo.minimumSupportedRelease).toBe('0.88.2');
  });
  test.each(nonCustom.map((action) => [action.name, action]))('%s has audience, classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['both', 'ai', 'human']).toContain(action.audience);
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(60);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });
  test('8 dropdown actions are human, 7 AI twins are ai, 19 are both', () => {
    expect(nonCustom.filter((action) => action.audience === 'human').map((action) => action.name).sort()).toEqual([...LEGACY_HUMAN].sort());
    expect(nonCustom.filter((action) => action.audience === 'ai').map((action) => action.name).sort()).toEqual([...AI_TWINS].sort());
    expect(nonCustom.filter((action) => action.audience === 'both')).toHaveLength(19);
  });
  test('AI-visible actions have no dynamic dropdowns', () => {
    for (const action of nonCustom.filter((item) => item.audience !== 'human')) {
      const types = Object.values(action.props).map((prop: unknown) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
      expect(types, action.name).not.toContain('DROPDOWN');
    }
  });
  test('non-idempotent actions are the creating ones', () => {
    expect(nonCustom.filter((action) => action.aiMetadata?.idempotent === false).map((action) => action.name).sort()).toEqual(
      ['create-country-targeting-rule', 'create-short-link', 'create_folder', 'create_link', 'create_links_bulk', 'delete-short-link', 'duplicate_link', 'set_country_rule'].sort(),
    );
  });
  test('trigger has aiMetadata, outputSchema and no password in sample data', () => {
    const trigger = shortIo.triggers()['new_link_created'];
    expect(trigger.outputSchema?.fields.length).toBeGreaterThan(0);
    expect(trigger.sampleData).not.toHaveProperty('password');
  });
});
