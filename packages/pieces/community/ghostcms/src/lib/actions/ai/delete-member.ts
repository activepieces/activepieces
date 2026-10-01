import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostDeleteMemberOutputSchema } from '../../output-schemas';

export const ghostDeleteMember = createAction({
  auth: ghostAuth,
  name: 'ghost_delete_member',
  outputSchema: ghostDeleteMemberOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Member',
  description: 'Permanently delete a member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a member and their history; it cannot be restored. A paid member keeps being billed by Stripe unless Cancel Stripe Subscriptions is on. A retry fails with not found.',
    idempotent: false,
  },
  props: {
    member_id: ghostProps.id('Member ID', 'The member ID, from List Members or Get Member by Email.'),
    cancel_stripe_subscriptions: Property.Checkbox({
      displayName: 'Cancel Stripe Subscriptions',
      description: 'Also cancel the member paid Stripe subscriptions. Off by default.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const member_id = context.propsValue.member_id.trim();
    const cancel = context.propsValue.cancel_stripe_subscriptions === true;
    await ghostResource.remove(context.auth, 'members', ghostCommon.id(member_id, 'Member ID'), {
      cancel: cancel ? 'true' : undefined,
    });
    return { success: true, member_id, stripe_subscriptions_cancelled: cancel };
  },
});
