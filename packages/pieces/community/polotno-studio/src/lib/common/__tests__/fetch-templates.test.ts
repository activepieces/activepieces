import { describe, expect, it, vi } from 'vitest';
import type { PolotnoClient } from '../client';
import { fetchAllTemplates } from '../props';

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
    await fetchAllTemplates({ client: clientOf(request) });
    expect(request.mock.calls[0][0].queryParams['omit_design']).toBe('true');
  });

  it('follows next_cursor across pages', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(page({ ids: ['tpl_1'], next: 'cur_1' }))
      .mockResolvedValueOnce(page({ ids: ['tpl_2'], next: null }));

    const result = await fetchAllTemplates({ client: clientOf(request) });

    expect(result.map((t) => t.id)).toEqual(['tpl_1', 'tpl_2']);
    expect(request.mock.calls[1][0].queryParams['cursor']).toBe('cur_1');
  });

  it('stops at maxResults', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: ['tpl_1', 'tpl_2', 'tpl_3'], next: 'cur_next' }));
    const result = await fetchAllTemplates({ client: clientOf(request), filters: { maxResults: 2 } });
    expect(result).toHaveLength(2);
  });

  it('omits archived rather than sending false', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: [], next: null }));
    await fetchAllTemplates({ client: clientOf(request), filters: { archived: false } });
    expect(request.mock.calls[0][0].queryParams['archived']).toBeUndefined();
  });

  it('passes a name filter through', async () => {
    const request = vi.fn().mockResolvedValue(page({ ids: [], next: null }));
    await fetchAllTemplates({ client: clientOf(request), filters: { name: 'promo' } });
    expect(request.mock.calls[0][0].queryParams['name']).toBe('promo');
  });

  it('follows next_cursor past the default page size when given a higher maxResults', async () => {
    const firstPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${i}`);
    const secondPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${100 + i}`);
    const request = vi
      .fn()
      .mockResolvedValueOnce(page({ ids: firstPageIds, next: 'cur_1' }))
      .mockResolvedValueOnce(page({ ids: secondPageIds, next: null }));

    const result = await fetchAllTemplates({ client: clientOf(request), filters: { maxResults: 1000 } });

    expect(result).toHaveLength(200);
    expect(request.mock.calls).toHaveLength(2);
    expect(request.mock.calls[1][0].queryParams['cursor']).toBe('cur_1');
  });

  it('stops at the 1000 cap when the server keeps returning a next_cursor', async () => {
    const fullPageIds = Array.from({ length: 100 }, (_, i) => `tpl_${i}`);
    const request = vi.fn().mockResolvedValue(page({ ids: fullPageIds, next: 'cur_next' }));

    const result = await fetchAllTemplates({ client: clientOf(request), filters: { maxResults: 1000 } });

    expect(result).toHaveLength(1000);
    expect(request.mock.calls).toHaveLength(10);
  });
});
