import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { currentNewsletterIds, requireIds, saveNewsletters } from '../../common/member-newsletters';
import { ghostMemberOutputSchema } from '../../output-schemas';

export const ghostSubscribeMemberToNewsletters = createAction({
  auth: ghostAuth,
  name: 'ghost_subscribe_member_to_newsletters',
  outputSchema: ghostMemberOutputSchema,
  classification: 'WRITE',
  displayName: 'Subscribe Member to Newsletters',
  description: 'Add newsletter subscriptions to a member, keeping existing ones.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Subscribes a member to one or more newsletters while keeping their current subscriptions, and returns the updated member. Newsletter IDs come from List Newsletters. Re-subscribing is a no-op. Ghost has no single-newsletter subscribe call, so this reads the member subscription list and saves it back in one step; a change to that member subscription list made in the same moment can be overwritten.',
    idempotent: true,
  },
  props: {
    member_id: ghostProps.id('Member ID', 'The member ID, from List Members or Get Member by Email.'),
    newsletter_ids: ghostProps.newsletterIds('Newsletter IDs', 'The newsletters to add, from List Newsletters.', true),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.member_id, 'Member ID');
    const add = requireIds(context.propsValue.newsletter_ids);
    const current = await currentNewsletterIds({ auth: context.auth, memberId: id });
    return saveNewsletters({ auth: context.auth, memberId: id, ids: Array.from(new Set([...current, ...add])) });
  },
});
