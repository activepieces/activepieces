import { createAction, Property } from '@activepieces/pieces-framework';
import { revokeBadgeFromMember } from '../api';
import { buildBadgesDropdown } from '../props';
import { bettermodeAuth } from '../auth';

export const revokeBadgeAction = createAction({
  name: 'revoke_badge',
  auth: bettermodeAuth,
  displayName: 'Revoke Badge from Member',
  description: 'Revoke a badge from a member by email',
  audience: 'both',
  aiMetadata: { description: 'Removes a Bettermode badge (by badge ID) from the member resolved from the given email address. The email must match a network member, or the call fails. Idempotent: the member ends up without the badge regardless of how many times it is called.', idempotent: true },
  props: {
    badgeId: Property.Dropdown({
      auth: bettermodeAuth,
      displayName: 'Badge',
      description: 'The badge to revoke',
      required: true,
      refreshers: [],
      options: async ({ auth }) =>
        await buildBadgesDropdown(auth?.props),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the member to revoke the badge from',
      required: true,
    }),
  },  
  async run(context) {
    return await revokeBadgeFromMember(
      context.auth.props,
      context.propsValue.badgeId,
      context.propsValue.email
    );
  },
});
