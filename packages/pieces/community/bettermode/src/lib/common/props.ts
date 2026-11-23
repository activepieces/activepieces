import { Property } from '@activepieces/pieces-framework';
import { bettermodeAuth } from '../auth';
import { getSession } from './client';
import { bettermodeOps } from './operations';

export const memberSpacesDropdown = Property.Dropdown({
  auth: bettermodeAuth,
  displayName: 'Space',
  description: 'Lists the spaces the connected member has joined.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { options: [], disabled: true, placeholder: 'Please connect your account first' };
    }
    try {
      const session = await getSession(auth.props);
      const options: { label: string; value: string }[][] = [];
      let after: string | null = null;
      for (let pageIndex = 0; pageIndex < bettermodeOps.MAX_PAGES; pageIndex++) {
        const page = await bettermodeOps.listSpacesPage({
          auth: auth.props,
          limit: 100,
          after,
          query: undefined,
          memberId: session.memberId,
        });
        options.push(
          page.items.flatMap((space) =>
            space.id === null ? [] : [{ label: space.name ?? space.id, value: space.id }]
          )
        );
        if (!page.has_more || page.next_cursor === null) {
          break;
        }
        after = page.next_cursor;
      }
      const flattened = options.flat();
      if (flattened.length === 0) {
        return { options: [], disabled: false, placeholder: 'No spaces found. Join a space first.' };
      }
      return { options: flattened, disabled: false };
    } catch (error) {
      return {
        options: [],
        disabled: true,
        placeholder: `Could not load spaces: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  },
});

export const badgesDropdown = Property.Dropdown({
  auth: bettermodeAuth,
  displayName: 'Badge',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { options: [], disabled: true, placeholder: 'Please connect your account first' };
    }
    try {
      const badges = await bettermodeOps.listBadges({ auth: auth.props });
      const badgeOptions = badges.flatMap((badge) =>
        badge.id === null ? [] : [{ label: badge.name ?? badge.id, value: badge.id }]
      );
      if (badgeOptions.length === 0) {
        return { options: [], disabled: false, placeholder: 'No badges found. Create one in Bettermode first.' };
      }
      return { options: badgeOptions, disabled: false };
    } catch (error) {
      return {
        options: [],
        disabled: true,
        placeholder: `Could not load badges: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  },
});
