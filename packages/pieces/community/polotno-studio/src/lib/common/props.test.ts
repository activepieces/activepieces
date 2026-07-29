import { describe, expect, it, vi } from 'vitest';
import { PropertyType } from '@activepieces/pieces-framework';
import type { PolotnoClient } from './client';
import { sharedProps } from './props';
import type { FieldDef } from './types';

const field = (over: Partial<FieldDef>): FieldDef => ({
  key: 'fields__x__text', label: 'X', type: 'string', required: false, ...over,
});

describe('fieldsToProps', () => {
  it('keys props by the flat key verbatim', () => {
    const props = sharedProps.fieldsToProps([field({ key: 'fields__deep__name__text' })]);
    expect(Object.keys(props)).toEqual(['fields__deep__name__text']);
  });

  it('maps each API type to the right property type', () => {
    const props = sharedProps.fieldsToProps([
      field({ key: 'a', type: 'string' }),
      field({ key: 'b', type: 'url' }),
      field({ key: 'c', type: 'integer' }),
      field({ key: 'd', type: 'color' }),
      field({ key: 'e', type: 'boolean' }),
    ]);
    expect(props['a'].type).toBe(PropertyType.SHORT_TEXT);
    expect(props['b'].type).toBe(PropertyType.SHORT_TEXT);
    expect(props['c'].type).toBe(PropertyType.NUMBER);
    expect(props['d'].type).toBe(PropertyType.COLOR);
    expect(props['e'].type).toBe(PropertyType.CHECKBOX);
  });

  it('carries label, required, help text and default across', () => {
    const props = sharedProps.fieldsToProps([
      field({ key: 'a', label: 'Headline', required: true, help_text: 'Top line', default: 'Hi' }),
    ]);
    expect(props['a'].displayName).toBe('Headline');
    expect(props['a'].required).toBe(true);
    expect(props['a'].description).toBe('Top line');
    expect(props['a'].defaultValue).toBe('Hi');
  });

  it('returns an empty map for no fields', () => {
    expect(sharedProps.fieldsToProps([])).toEqual({});
  });
});

const page = ({ ids, next }: { ids: string[]; next: string | null }) => ({
  items: ids.map((id) => ({ id, name: id })),
  next_cursor: next,
});

function clientOf(request: ReturnType<typeof vi.fn>): PolotnoClient {
  return { request };
}

describe('fetchAllTemplates', () => {
  it('always omits the design blob', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: ['tpl_1'], next: null }));
    await sharedProps.fetchAllTemplates({ client: clientOf(request) });
    expect(request.mock.calls[0][0].queryParams['omit_design']).toBe('true');
  });

  it('follows next_cursor across pages', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(page({ ids: ['tpl_1'], next: 'cur_1' }))
      .mockResolvedValueOnce(page({ ids: ['tpl_2'], next: null }));

    const result = await sharedProps.fetchAllTemplates({ client: clientOf(request) });

    expect(result.map((t) => t.id)).toEqual(['tpl_1', 'tpl_2']);
    expect(request.mock.calls[1][0].queryParams['cursor']).toBe('cur_1');
  });

  it('stops at maxResults', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: ['tpl_1', 'tpl_2', 'tpl_3'], next: 'cur_next' }));
    const result = await sharedProps.fetchAllTemplates({ client: clientOf(request), filters: { maxResults: 2 } });
    expect(result).toHaveLength(2);
  });

  it('omits archived rather than sending false', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: [], next: null }));
    await sharedProps.fetchAllTemplates({ client: clientOf(request), filters: { archived: false } });
    expect(request.mock.calls[0][0].queryParams['archived']).toBeUndefined();
  });

  it('passes a name filter through', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: [], next: null }));
    await sharedProps.fetchAllTemplates({ client: clientOf(request), filters: { name: 'promo' } });
    expect(request.mock.calls[0][0].queryParams['name']).toBe('promo');
  });

  it('follows next_cursor past the default page size when given a higher maxResults', async () => {
    const firstPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${i}`);
    const secondPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${100 + i}`);
    const request = vi
      .fn()
      .mockResolvedValueOnce(page({ ids: firstPageIds, next: 'cur_1' }))
      .mockResolvedValueOnce(page({ ids: secondPageIds, next: null }));

    const result = await sharedProps.fetchAllTemplates({ client: clientOf(request), filters: { maxResults: 1000 } });

    expect(result).toHaveLength(200);
    expect(request.mock.calls).toHaveLength(2);
    expect(request.mock.calls[1][0].queryParams['cursor']).toBe('cur_1');
  });

  it('stops at the 1000 cap when the server keeps returning a next_cursor', async () => {
    const fullPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${i}`);
    const request = vi.fn().mockResolvedValue(page({ ids: fullPageIds, next: 'cur_next' }));

    const result = await sharedProps.fetchAllTemplates({ client: clientOf(request), filters: { maxResults: 1000 } });

    expect(result).toHaveLength(1000);
    expect(request.mock.calls).toHaveLength(10);
  });

  it('stops when the server returns an empty page with a next_cursor', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: [], next: 'cur_next' }));

    const result = await sharedProps.fetchAllTemplates({ client: clientOf(request) });

    expect(result).toEqual([]);
    expect(request.mock.calls).toHaveLength(1);
  });
});
