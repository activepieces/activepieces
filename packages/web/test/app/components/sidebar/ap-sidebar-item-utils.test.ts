import { describe, expect, it } from 'vitest';

import { sidebarItemUtils } from '@/app/components/sidebar/ap-sidebar-item-utils';

describe('sidebarItemUtils.keptSearch', () => {
  it('keeps the keys the target page asks for', () => {
    expect(
      sidebarItemUtils.keptSearch({
        search: '?month=2026-08',
        keys: ['month'],
      }),
    ).toBe('month=2026-08');
  });

  it("drops a table's own filters and cursor", () => {
    expect(
      sidebarItemUtils.keptSearch({
        search:
          '?status=ERROR&displayName=gmail&cursor=abc&limit=10&month=2026-08',
        keys: ['month'],
      }),
    ).toBe('month=2026-08');
  });

  it('returns nothing when no kept key is present', () => {
    expect(
      sidebarItemUtils.keptSearch({
        search: '?status=ACTIVE&limit=10',
        keys: ['month'],
      }),
    ).toBe('');
    expect(sidebarItemUtils.keptSearch({ search: '', keys: ['month'] })).toBe(
      '',
    );
  });

  it('keeps nothing for a page that asks for no keys', () => {
    expect(
      sidebarItemUtils.keptSearch({ search: '?month=2026-08', keys: [] }),
    ).toBe('');
  });
});
