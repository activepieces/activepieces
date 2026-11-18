import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostDeleteLabelOutputSchema } from '../../output-schemas';

export const ghostDeleteLabel = createAction({
  auth: ghostAuth,
  name: 'ghost_delete_label',
  outputSchema: ghostDeleteLabelOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Label',
  description: 'Permanently delete a member label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a member label and removes it from every member; the members stay. It cannot be restored, and a retry fails with not found.',
    idempotent: false,
  },
  props: {
    label_id: ghostProps.id('Label ID', 'The label ID, from List Labels.'),
  },
  async run(context) {
    const label_id = context.propsValue.label_id.trim();
    await ghostResource.remove(context.auth, 'labels', ghostCommon.id(label_id, 'Label ID'));
    return { success: true, label_id };
  },
});
