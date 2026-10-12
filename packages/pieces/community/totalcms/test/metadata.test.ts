import { describe, expect, test } from 'vitest';
import { totalcms } from '../src';

const actions = Object.values(totalcms.actions());
const nonCustom = actions.filter((action) => action.name !== 'custom_api_call');
const triggers = Object.values(totalcms.triggers());

describe('piece metadata', () => {
  test('30 actions plus custom API call, 3 triggers', () => {
    expect(nonCustom).toHaveLength(30);
    expect(actions).toHaveLength(31);
    expect(triggers.map((trigger) => trigger.name).sort()).toEqual(['new_blog_post', 'new_object', 'updated_object']);
  });

  test('legacy action names are kept', () => {
    const names = nonCustom.map((action) => action.name);
    for (const name of [
      'get_content', 'get_blog_post', 'save_blog_post', 'save_blog_image', 'save_blog_gallery', 'save_text', 'save_toggle',
      'save_date', 'save_image', 'save_gallery', 'save_file', 'save_depot', 'save_video',
    ]) {
      expect(names).toContain(name);
    }
  });

  test.each(nonCustom.map((action) => [action.name, action]))('%s declares audience, classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['both', 'ai', 'human']).toContain(action.audience);
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(60);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });

  test('actions visible to agents have no dynamic dropdowns', () => {
    for (const action of nonCustom.filter((item) => item.audience !== 'human')) {
      const types = Object.values(action.props).map((prop: unknown) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
      expect(types, action.name).not.toContain('DROPDOWN');
    }
  });

  test('only delete is destructive and it is human-only', () => {
    const destructive = nonCustom.filter((action) => action.classification === 'DESTRUCTIVE');
    expect(destructive.map((action) => action.name)).toEqual(['delete_object']);
    expect(destructive[0].audience).toBe('human');
  });

  test('triggers are READ with aiMetadata', () => {
    for (const trigger of triggers) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
    }
  });

  test('minimum release supports ai audience', () => {
    expect(totalcms.minimumSupportedRelease).toBe('0.88.2');
  });
});
