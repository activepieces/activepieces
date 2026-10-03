import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostMemberOutputSchema } from '../../output-schemas';

export const ghostGetMember = createAction({
  auth: ghostAuth,
  name: 'ghost_get_member',
  outputSchema: ghostMemberOutputSchema,
  classification: 'READ',
  displayName: 'Get Member',
  description: 'Get a member by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one member by ID with labels, newsletter subscriptions, tiers and paid status. Use Get Member by Email when only the email is known.',
    idempotent: true,
  },
  props: {
    member_id: ghostProps.id('Member ID', 'The member ID, from List Members or Get Member by Email.'),
  },
  async run(context) {
    return ghostResource.get(context.auth, 'members', ghostCommon.id(context.propsValue.member_id, 'Member ID'));
  },
});
