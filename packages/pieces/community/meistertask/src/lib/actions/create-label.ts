import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { meisterTaskApiService } from '../common/requests';

export const createLabel = createAction({
  auth: meisterTaskAuth,
  name: 'createLabel',
  displayName: 'Create Label',
  description: 'Creates a new label',
  props: {
    projectId: projectDropdown({
      displayName: 'Select Project',
      description: 'Select a project',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Label Name',
      description:
        'The name of the label. Must be unique (case-insensitive) for the project.',
      required: true,
    }),
    color: Property.Color({
      displayName: 'Label Name',
      description:
        'The color of the label. Any of: d93651 (red), ff9f1a (orange), ffd500 (yellow), 8acc47 (grass green), 47cc8a (moss green), 30bfbf (turquoise), 00aaff (blue), 8f7ee6 (purple), 98aab3 (grey)',
      required: false,
      defaultValue: 'd93651',
    }),
  },
  async run(context) {
    return await meisterTaskApiService.createLabel({
      auth: context.auth,
      projectId: context.propsValue.projectId,
      payload: {
        name: context.propsValue.name,
        color: context.propsValue.color,
      },
    });
  },
});
