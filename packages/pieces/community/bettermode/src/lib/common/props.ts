import { Property } from '@activepieces/pieces-framework';
import { bettermodeAuth } from '../auth';
import { getSession } from './client';
import { bettermodeOps } from './operations';

export const memberSpacesDropdown = Property.Dropdown({
  auth: bettermodeAuth,
  displayName: 'Space',
  description: 'The space to post in. Lists the spaces the connected member has joined.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { options: [], disabled: true, placeholder: 'Please authenticate first' };
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
      return { options: options.flat(), disabled: false };
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
  description: 'The badge to assign or revoke',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { options: [], disabled: true, placeholder: 'Please authenticate first' };
    }
    try {
      const badges = await bettermodeOps.listBadges({ auth: auth.props });
      return {
        options: badges.flatMap((badge) =>
          badge.id === null ? [] : [{ label: badge.name ?? badge.id, value: badge.id }]
        ),
        disabled: false,
      };
    } catch (error) {
      return {
        options: [],
        disabled: true,
        placeholder: `Could not load badges: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  },
});
