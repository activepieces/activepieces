import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { changeMemberLabel } from '../../common/member-labels';
import { ghostMemberOutputSchema } from '../../output-schemas';

export const ghostRemoveMemberLabel = createAction({
  auth: ghostAuth,
  name: 'ghost_remove_member_label',
  outputSchema: ghostMemberOutputSchema,
  classification: 'WRITE',
  displayName: 'Remove Member Label',
  description: 'Remove one label from a member, keeping their other labels.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one label from a member without touching their other labels, and returns the updated member. The label itself is kept; use Delete Label to remove it everywhere. Removing a label the member does not have is a no-op.',
    idempotent: true,
  },
  props: {
    member_id: ghostProps.id('Member ID', 'The member ID, from List Members or Get Member by Email.'),
    label_id: ghostProps.id('Label ID', 'The label ID, from List Labels or Get Member.'),
  },
  async run(context) {
    return changeMemberLabel({
      auth: context.auth,
      memberId: context.propsValue.member_id,
      labelId: context.propsValue.label_id,
      action: 'removeLabel',
    });
  },
});
