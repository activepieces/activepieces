import { ApEdition } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  STATIC_PAGES,
  staticPageUtils,
  type StaticPage,
} from '@/app/components/global-search/static-pages';

describe('global search Tiers page', () => {
  it.each([ApEdition.CLOUD, ApEdition.ENTERPRISE])(
    'shows to platform admins on %s',
    (edition) => {
      expect(
        staticPageUtils.isVisible({
          page: tiersPage(),
          isPlatformAdmin: true,
          edition,
        }),
      ).toBe(true);
    },
  );

  it('stays hidden on community', () => {
    expect(
      staticPageUtils.isVisible({
        page: tiersPage(),
        isPlatformAdmin: true,
        edition: ApEdition.COMMUNITY,
      }),
    ).toBe(false);
  });

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

describe('global search AI Usage page', () => {
  it.each([ApEdition.CLOUD, ApEdition.ENTERPRISE])(
    'shows to platform admins on %s',
    (edition) => {
      expect(
        staticPageUtils.isVisible({
          page: usagePage(),
          isPlatformAdmin: true,
          edition,
        }),
      ).toBe(true);
    },
  );

  it('stays hidden on community', () => {
    expect(
      staticPageUtils.isVisible({
        page: usagePage(),
        isPlatformAdmin: true,
        edition: ApEdition.COMMUNITY,
      }),
    ).toBe(false);
  });
});

function tiersPage(): StaticPage {
  return pageAt({ href: '/platform/ai/tiers' });
}

function usagePage(): StaticPage {
  return pageAt({ href: '/platform/ai/usage' });
}

function pageAt({ href }: { href: string }): StaticPage {
  const page = STATIC_PAGES.find((candidate) => candidate.href === href);
  if (page === undefined) {
    throw new Error(`${href} is missing from global search`);
  }
  return page;
}
