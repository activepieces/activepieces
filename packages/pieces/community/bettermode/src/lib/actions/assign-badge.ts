import { createAction, Property } from '@activepieces/pieces-framework';
import { assignBadgeToMember } from '../api';
import { buildBadgesDropdown } from '../props';
import { bettermodeAuth, BettermodeAuthType } from '../auth';

export const assignBadgeAction = createAction({
  name: 'assign_badge',
  auth: bettermodeAuth,
  displayName: 'Assign Badge to Member',
  description: 'Assign an existing badge to a member by email',
  props: {
    badgeId: Property.Dropdown({
      displayName: 'Badge',
      description: 'The badge to assign',
      required: true,
      refreshers: [],
      options: async ({ auth }) =>
        await buildBadgesDropdown(auth as BettermodeAuthType),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the member to assign the badge to',
      required: true,
    }),
  },
  async run(context) {
    return await assignBadgeToMember(
      context.auth as BettermodeAuthType,
      context.propsValue.badgeId,
      context.propsValue.email
    );
  },
});
