import { describe, expect, it, vi } from 'vitest';
import type { PolotnoClient } from '../client';
import { fetchAllTemplates } from '../props';

const page = (ids: string[], next: string | null) => ({
  items: ids.map((id) => ({ id, name: id })),
  next_cursor: next,
});

describe('fetchAllTemplates', () => {
  it('always omits the design blob', async () => {
    const request = vi.fn().mockResolvedValue(page(['tpl_1'], null));
    await fetchAllTemplates({ request } as unknown as PolotnoClient);
    expect(request.mock.calls[0][0].queryParams['omit_design']).toBe('true');
  });

  it('follows next_cursor across pages', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(page(['tpl_1'], 'cur_1'))
      .mockResolvedValueOnce(page(['tpl_2'], null));

    const result = await fetchAllTemplates({ request } as unknown as PolotnoClient);

    expect(result.map((t) => t.id)).toEqual(['tpl_1', 'tpl_2']);
    expect(request.mock.calls[1][0].queryParams['cursor']).toBe('cur_1');
  });

  it('stops at maxResults', async () => {
    const request = vi.fn().mockResolvedValue(page(['tpl_1', 'tpl_2', 'tpl_3'], 'cur_next'));
    const result = await fetchAllTemplates({ request } as unknown as PolotnoClient, { maxResults: 2 });
    expect(result).toHaveLength(2);
  });

  it('omits archived rather than sending false', async () => {
    const request = vi.fn().mockResolvedValue(page([], null));
    await fetchAllTemplates({ request } as unknown as PolotnoClient, { archived: false });
    expect(request.mock.calls[0][0].queryParams['archived']).toBeUndefined();
  });

  it('passes a name filter through', async () => {
    const request = vi.fn().mockResolvedValue(page([], null));
    await fetchAllTemplates({ request } as unknown as PolotnoClient, { name: 'promo' });
    expect(request.mock.calls[0][0].queryParams['name']).toBe('promo');
  });

  it('follows next_cursor past the default page size when given a higher maxResults', async () => {
    const firstPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${i}`);
    const secondPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${100 + i}`);
    const request = vi
      .fn()
      .mockResolvedValueOnce(page(firstPageIds, 'cur_1'))
      .mockResolvedValueOnce(page(secondPageIds, null));

    const result = await fetchAllTemplates({ request } as unknown as PolotnoClient, { maxResults: 1000 });

    expect(result).toHaveLength(200);
    expect(request.mock.calls).toHaveLength(2);
    expect(request.mock.calls[1][0].queryParams['cursor']).toBe('cur_1');
  });

  it('stops at the 1000 cap when the server keeps returning a next_cursor', async () => {
    const fullPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${i}`);
    const request = vi.fn().mockResolvedValue(page(fullPageIds, 'cur_next'));

    const result = await fetchAllTemplates({ request } as unknown as PolotnoClient, { maxResults: 1000 });

    expect(result).toHaveLength(1000);
    expect(request.mock.calls).toHaveLength(10);
  });
});
