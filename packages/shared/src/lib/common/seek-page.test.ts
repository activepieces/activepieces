import { describe, expect, it } from 'vitest';

describe('Wave 1: Activepieces SeekPage Pagination Utilities', () => {
  const buildPageResponse = (items: number[], nextCursor: string | null, prevCursor: string | null) => ({
    data: items,
    next: nextCursor,
    previous: prevCursor,
  });

  it('should create valid single page response without next cursor when terminal', () => {
    const page = buildPageResponse([1, 2, 3], null, null);
    expect(page.data.length).toBe(3);
    expect(page.next).toBeNull();
    expect(page.previous).toBeNull();
  });

  it('should retain pagination cursors for multi-batch streams', () => {
    const page = buildPageResponse([10, 20], 'cursor_abc123', 'cursor_prev000');
    expect(page.next).toBe('cursor_abc123');
    expect(page.previous).toBe('cursor_prev000');
  });
});
