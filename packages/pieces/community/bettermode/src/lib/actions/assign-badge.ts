import { createAction, Property } from '@activepieces/pieces-framework';
import { assignBadgeToMember } from '../api';
import { buildBadgesDropdown } from '../props';
import { bettermodeAuth } from '../auth';

export const assignBadgeAction = createAction({
  name: 'assign_badge',
  auth: bettermodeAuth,
  displayName: 'Assign Badge to Member',
  description: 'Assign an existing badge to a member by email',
  audience: 'both',
  aiMetadata: { description: 'Grants an existing Bettermode badge (by badge ID) to the member resolved from the given email address. The badge must already exist and the email must match a network member, or the call fails. Idempotent: the member ends up holding the badge regardless of how many times it is called.', idempotent: true },
  props: {
    badgeId: Property.Dropdown({
      auth: bettermodeAuth,
      displayName: 'Badge',
      description: 'The badge to assign',
      required: true,
      refreshers: [],
      options: async ({ auth }) =>
        await buildBadgesDropdown(auth?.props),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the member to assign the badge to',
      required: true,
    }),
  },
  async run(context) {
    return await assignBadgeToMember(
      context.auth.props,
      context.propsValue.badgeId,
      context.propsValue.email
    );
  },
});
