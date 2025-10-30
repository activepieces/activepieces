import { createAction, Property } from '@activepieces/pieces-framework';
import { projectDropdown } from '../common/props';
import { meisterTaskApiService } from '../common/requests';
import { meisterTaskAuth } from '../common/auth';

export const findOrCreateLabel = createAction({
  auth: meisterTaskAuth,
  name: 'findOrCreateLabel',
  displayName: 'Find or Create Label',
  description: 'Finds a label by searching, or creates one if it doesn’t exist',
  props: {
    projectId: projectDropdown({
      displayName: 'Select Task',
      description: 'Select a task',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the label to search for',
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
    const { projectId, name } = context.propsValue;

    const response = await meisterTaskApiService.fetchLabels({
      auth: context.auth,
      projectId,
    });

    const matchingItems = response.filter(
      (item: any) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (matchingItems.length > 0) {
      return {
        found: true,
        data: matchingItems,
        message:
          matchingItems.length === 1
            ? 'Found 1 matching label'
            : `Found ${matchingItems.length} matching labels`,
      };
    }

    const resp = await meisterTaskApiService.createLabel({
      auth: context.auth,
      projectId: context.propsValue.projectId,
      payload: {
        name: context.propsValue.name,
        color: context.propsValue.color,
      },
    });
    
    return {
      found: false,
      data: resp,
      message: 'Found 0 matching labels. Created New Label',
    };
  },
});
