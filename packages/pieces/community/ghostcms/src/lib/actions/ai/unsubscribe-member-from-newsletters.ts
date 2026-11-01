import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { requireIds, saveNewsletters, unsubscribeFromNewsletter } from '../../common/member-newsletters';
import { ghostResource } from '../../common/resources';
import { ghostMemberOutputSchema } from '../../output-schemas';

export const ghostUnsubscribeMemberFromNewsletters = createAction({
  auth: ghostAuth,
  name: 'ghost_unsubscribe_member_from_newsletters',
  outputSchema: ghostMemberOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Member from Newsletters',
  description: 'Remove newsletter subscriptions from a member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unsubscribes a member from the given newsletters, or from every newsletter when Unsubscribe from All is on, keeping the member account. Each newsletter is removed on its own in Ghost, so a subscription added to the member at the same time is never lost. Returns the updated member. Unsubscribing twice is a no-op.',
    idempotent: true,
  },
  props: {
    member_id: ghostProps.id('Member ID', 'The member ID, from List Members or Get Member by Email.'),
    newsletter_ids: ghostProps.newsletterIds(
      'Newsletter IDs',
      'The newsletters to remove, from Get Member or List Newsletters.',
      false
    ),
    unsubscribe_from_all: Property.Checkbox({
      displayName: 'Unsubscribe from All',
      description: 'Remove every newsletter subscription. Newsletter IDs are ignored when on.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.member_id, 'Member ID');
    if (context.propsValue.unsubscribe_from_all === true) {
      return saveNewsletters({ auth: context.auth, memberId: id, ids: [] });
    }
    const remove = Array.from(new Set(requireIds(context.propsValue.newsletter_ids)));
    await ghostResource.get(context.auth, 'members', id);
    for (const newsletterId of remove) {
      await unsubscribeFromNewsletter({ auth: context.auth, memberId: id, newsletterId });
    }
    return ghostResource.get(context.auth, 'members', id);
  },
});
