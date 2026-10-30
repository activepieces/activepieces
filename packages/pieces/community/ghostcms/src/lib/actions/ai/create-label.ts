import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostResource } from '../../common/resources';
import { ghostCreateLabelOutputSchema } from '../../output-schemas';

export const ghostCreateLabel = createAction({
  auth: ghostAuth,
  name: 'ghost_create_label',
  outputSchema: ghostCreateLabelOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Label',
  description: 'Create a member label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a member label used to segment members. Ghost rejects a duplicate name, so check List Labels first. Returns the label ID for Add Member Label.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The label name.',
      required: true,
    }),
  },
  async run(context) {
    return ghostResource.create(context.auth, 'labels', ghostResource.pick(context.propsValue, ['name']));
  },
});
