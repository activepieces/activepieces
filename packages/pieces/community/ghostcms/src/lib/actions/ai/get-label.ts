import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostLabelOutputSchema } from '../../output-schemas';

export const ghostGetLabel = createAction({
  auth: ghostAuth,
  name: 'ghost_get_label',
  outputSchema: ghostLabelOutputSchema,
  classification: 'READ',
  displayName: 'Get Label',
  description: 'Get a member label by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one member label by ID with its name, slug and member count.',
    idempotent: true,
  },
  props: {
    label_id: ghostProps.id('Label ID', 'The label ID, from List Labels.'),
  },
  async run(context) {
    return ghostResource.get(context.auth, 'labels', ghostCommon.id(context.propsValue.label_id, 'Label ID'), {
      include: 'count.members',
    });
  },
});
