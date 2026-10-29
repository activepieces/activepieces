import { ApEdition } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  STATIC_PAGES,
  staticPageUtils,
  type StaticPage,
} from '@/app/components/global-search/static-pages';

describe('global search Tiers page', () => {
  it('shows to platform admins on cloud', () => {
    expect(
      staticPageUtils.isVisible({
        page: tiersPage(),
        isPlatformAdmin: true,
        edition: ApEdition.CLOUD,
      }),
    ).toBe(true);
  });

  it.each([ApEdition.ENTERPRISE, ApEdition.COMMUNITY, null])(
    'stays hidden on %s',
    (edition) => {
      expect(
        staticPageUtils.isVisible({
          page: tiersPage(),
          isPlatformAdmin: true,
          edition,
        }),
      ).toBe(false);
    },
  );

  it('stays hidden from non-admins on cloud', () => {
    expect(
      staticPageUtils.isVisible({
        page: tiersPage(),
        isPlatformAdmin: false,
        edition: ApEdition.CLOUD,
      }),
    ).toBe(false);
  });
});

function tiersPage(): StaticPage {
  const page = STATIC_PAGES.find(
    (candidate) => candidate.href === '/platform/ai/tiers',
  );
  if (page === undefined) {
    throw new Error('The Tiers page is missing from global search');
  }
  return page;
}
