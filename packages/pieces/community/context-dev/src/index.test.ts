import { describe, expect, it } from 'vitest';

import { contextDev } from './index';

describe('Context.dev piece metadata', () => {
  it('exposes the expected action surface', () => {
    const metadata = contextDev.metadata();

    expect(metadata.displayName).toBe('Context.dev');
    expect(Object.keys(metadata.actions).sort()).toEqual([
      'crawl_website',
      'custom_api_call',
      'extract_structured_data',
      'find_website_pages',
      'get_brand_profile',
      'scrape_url',
      'search_web',
    ]);
    expect(Object.keys(metadata.triggers)).toHaveLength(0);
    expect(metadata.auth).toBeDefined();
    expect(metadata.authors).toEqual(['aadithyanr']);
  });

  it('declares AI metadata and classifications on every native action', () => {
    const actions = Object.values(contextDev.metadata().actions).filter(
      (action) => action.name !== 'custom_api_call'
    );

    expect(actions).toHaveLength(6);
    for (const action of actions) {
      expect(action.audience).toBe('both');
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(action.aiMetadata?.idempotent).toBe(true);
      expect(['READ', 'SEARCH']).toContain(action.classification);
    }
  });
});
