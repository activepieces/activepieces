import { describe, expect, it } from 'vitest';

import { sidebarItemUtils } from '@/app/components/sidebar/ap-sidebar-item';

describe('sidebarItemUtils.sectionSearch', () => {
  it('keeps the month shared by a section', () => {
    expect(sidebarItemUtils.sectionSearch('?month=2026-08')).toBe(
      'month=2026-08',
    );
  });

  it("drops a table's own filters and cursor", () => {
    expect(
      sidebarItemUtils.sectionSearch(
        '?status=ERROR&displayName=gmail&cursor=abc&limit=10&month=2026-08',
      ),
    ).toBe('month=2026-08');
  });

  it('returns nothing when no shared key is present', () => {
    expect(sidebarItemUtils.sectionSearch('?status=ACTIVE&limit=10')).toBe('');
    expect(sidebarItemUtils.sectionSearch('')).toBe('');
  });
});
