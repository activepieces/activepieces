import { describe, expect, test } from 'vitest';
import { googleSearchConsolePiece } from '../src';

const actions = Object.values(googleSearchConsolePiece.actions());
const handWritten = actions.filter((action) => action.name !== 'custom_api_call');

describe('piece metadata', () => {
  test('16 actions plus custom API call, existing names unchanged', () => {
    expect(handWritten).toHaveLength(16);
    const names = actions.map((action) => action.name);
    for (const name of ['search_analytics', 'list_sitemaps', 'submit_sitemap', 'list_sites', 'add_site', 'delete_site', 'urlInspection', 'custom_api_call']) {
      expect(names).toContain(name);
    }
  });

  test.each(handWritten.map((action) => [action.name, action]))('%s declares audience, classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['both', 'ai', 'human']).toContain(action.audience);
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(60);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });

  test('agent-visible actions have no dynamic dropdowns', () => {
    for (const action of handWritten.filter((item) => item.audience !== 'human')) {
      const types = Object.values(action.props).map((prop: unknown) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
      expect(types, action.name).not.toContain('DROPDOWN');
      expect(types, action.name).not.toContain('DYNAMIC');
    }
  });

  test('every human action has an ai twin', () => {
    const twins: Record<string, string> = {
      search_analytics: 'search_analytics_by_site_url',
      list_sitemaps: 'list_sitemaps_by_site_url',
      submit_sitemap: 'submit_sitemap_by_site_url',
      delete_sitemap: 'delete_sitemap_by_site_url',
      delete_site: 'delete_site_by_site_url',
      urlInspection: 'inspect_url_by_site_url',
    };
    const byName = new Map(handWritten.map((action) => [action.name, action]));
    for (const action of handWritten.filter((item) => item.audience === 'human')) {
      const twin = byName.get(twins[action.name]);
      expect(twin?.audience, action.name).toBe('ai');
      expect(twin?.classification, action.name).toBe(action.classification);
    }
  });

  test('deletes are destructive; site deletes fail on retry, sitemap deletes do not; submit and add are idempotent writes', () => {
    for (const action of handWritten.filter((item) => item.name.startsWith('delete_'))) {
      expect(action.classification).toBe('DESTRUCTIVE');
      expect(action.aiMetadata?.idempotent).toBe(action.name.startsWith('delete_sitemap'));
    }
    for (const action of handWritten.filter((item) => item.name.startsWith('submit_') || item.name === 'add_site')) {
      expect(action.classification).toBe('WRITE');
      expect(action.aiMetadata?.idempotent).toBe(true);
    }
  });

  test('piece-level settings', () => {
    expect(googleSearchConsolePiece.minimumSupportedRelease).toBe('0.88.2');
    expect(googleSearchConsolePiece.categories).toEqual(['MARKETING']);
  });
});
