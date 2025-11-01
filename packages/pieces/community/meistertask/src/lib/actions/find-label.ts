import { createAction, Property } from '@activepieces/pieces-framework';
import { projectDropdown } from '../common/props';
import { meisterTaskApiService } from '../common/requests';
import { meisterTaskAuth } from '../common/auth';

export const findLabel = createAction({
  auth: meisterTaskAuth,
  name: 'findLabel',
  displayName: 'Find Label',
  description: 'Finds a label by searching',
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

    if (matchingItems.length === 0) {
      return {
        success: false,
        message: `No labels found with name: ${name}`,
        data: null,
        count: 0,
      };
    }

    return {
      success: true,
      data: matchingItems,
      count: matchingItems.length,
      message:
        matchingItems.length === 1
          ? 'Found 1 matching label'
          : `Found ${matchingItems.length} matching labels`,
    };
  },
});
