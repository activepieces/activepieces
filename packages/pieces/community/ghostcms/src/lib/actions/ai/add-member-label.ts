import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { changeMemberLabel } from '../../common/member-labels';
import { ghostMemberOutputSchema } from '../../output-schemas';

export const ghostAddMemberLabel = createAction({
  auth: ghostAuth,
  name: 'ghost_add_member_label',
  outputSchema: ghostMemberOutputSchema,
  classification: 'WRITE',
  displayName: 'Add Member Label',
  description: 'Add one label to a member, keeping their other labels.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one existing label to a member without touching their other labels, and returns the updated member. Get the label ID from List Labels or Create Label. Adding a label the member already has is a no-op.',
    idempotent: true,
  },
  props: {
    member_id: ghostProps.id('Member ID', 'The member ID, from List Members or Get Member by Email.'),
    label_id: ghostProps.id('Label ID', 'The label ID, from List Labels.'),
  },
  async run(context) {
    return changeMemberLabel({
      auth: context.auth,
      memberId: context.propsValue.member_id,
      labelId: context.propsValue.label_id,
      action: 'addLabel',
    });
  },
});
