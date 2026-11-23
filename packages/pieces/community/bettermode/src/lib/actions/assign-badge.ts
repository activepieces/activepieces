import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { bindTokenStore } from '../common/client';
import { bettermodeAuth } from '../auth';
import { bettermodeInput } from '../common/input';
import { bettermodeOps } from '../common/operations';
import { badgesDropdown } from '../common/props';
import { bettermodeSchemas } from '../common/schemas';

export const assignBadgeAction = createAction({
  name: 'assign_badge',
  classification: 'WRITE',
  auth: bettermodeAuth,
  displayName: 'Assign Badge To Member',
  description: 'Assign an existing badge to a member by email',
  audience: 'human',
  aiMetadata: {
    description: 'Grants an existing badge to the member whose email matches exactly. Agents should use Find Member by Email and Assign Badge to Member instead. Fails when no member has that exact email.',
    idempotent: false,
  },
  props: {
    adminNote: Property.MarkDown({
      value: 'This action needs a connection that uses a Bettermode admin account.',
      variant: MarkdownVariant.INFO,
    }),
    badgeId: badgesDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: "The member's exact email address.",
      placeholder: 'member@example.com',
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
    const result = await bettermodeOps.changeBadge({ auth, operation: 'assignBadge', badgeId, memberId: member.id });
    return { ...result, member_name: member.name, member_email: member.email };
  },
});
