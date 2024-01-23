import { createAction, Property } from '@activepieces/pieces-framework';
import { revokeBadgeFromMember } from '../api';
import { buildBadgesDropdown } from '../props';
import { bettermodeAuth, BettermodeAuthType } from '../auth';

export const revokeBadgeAction = createAction({
  name: 'revoke_badge',
  auth: bettermodeAuth,
  displayName: 'Revoke Badge from Member',
  description: 'Revoke a badge from a member by email',
  props: {
    badgeId: Property.Dropdown({
      displayName: 'Badge',
      description: 'The badge to revoke',
      required: true,
      refreshers: [],
      options: async ({ auth }) =>
        await buildBadgesDropdown(auth as BettermodeAuthType),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the member to revoke the badge from',
      required: true,
    }),
  },
  async run(context) {
    return await revokeBadgeFromMember(
      context.auth as BettermodeAuthType,
      context.propsValue.badgeId,
      context.propsValue.email
    );
  },
});
