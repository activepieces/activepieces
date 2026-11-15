import { createAction, Property } from '@activepieces/pieces-framework';
import { bindTokenStore } from '../common/client';
import { bettermodeAuth } from '../auth';
import { bettermodeInput } from '../common/input';
import { bettermodeOps } from '../common/operations';
import { badgesDropdown } from '../common/props';
import { bettermodeSchemas } from '../common/schemas';

export const revokeBadgeAction = createAction({
  name: 'revoke_badge',
  classification: 'WRITE',
  auth: bettermodeAuth,
  displayName: 'Revoke Badge From Member',
  description: 'Revoke a badge from a member by email',
  audience: 'human',
  aiMetadata: {
    description: 'Removes a badge from the member whose email matches exactly. Agents should use Find Member by Email and Revoke Badge from Member instead. Fails when no member has that exact email.',
    idempotent: false,
  },
  props: {
    badgeId: badgesDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The exact email of the member. The connected account must be an admin to look members up by email.',
      required: true,
    }),
  },
  outputSchema: bettermodeSchemas.legacyBadgeAction,
  async run(context) {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const auth = context.auth.props;
    const badgeId = bettermodeInput.requireText({ value: context.propsValue.badgeId, label: 'Badge' });
    const email = bettermodeInput.email({ value: context.propsValue.email, label: 'Email' });
    const member = await bettermodeOps.requireMemberByEmail({ auth, email });
    const result = await bettermodeOps.changeBadge({ auth, operation: 'revokeBadge', badgeId, memberId: member.id });
    return { ...result, member_name: member.name, member_email: member.email };
  },
});
