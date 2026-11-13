import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostCreateLabelOutputSchema } from '../../output-schemas';

export const ghostUpdateLabel = createAction({
  auth: ghostAuth,
  name: 'ghost_update_label',
  outputSchema: ghostCreateLabelOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Label',
  description: 'Rename a member label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames a member label by ID; members keep the label. Filters that reference the old label slug may stop matching.',
    idempotent: true,
  },
  props: {
    label_id: ghostProps.id('Label ID', 'The label ID, from List Labels.'),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new label name.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: 'The new label slug.',
      required: false,
    }),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.label_id, 'Label ID');
    return ghostResource.edit(context.auth, 'labels', id, ghostResource.pick(context.propsValue, ['name', 'slug']));
  },
});
