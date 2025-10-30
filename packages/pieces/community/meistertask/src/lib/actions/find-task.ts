import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskApiService } from '../common/requests';

export const findTask = createAction({
  auth: meisterTaskAuth,
  name: 'findTask',
  displayName: 'Find Task',
  description: 'Finds a task by searching',
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task to search for',
      required: true,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    params.append('items', String(1000));
    params.append('page', String(1));

    const response = await meisterTaskApiService.fetchTasks({
      auth: context.auth,
      queryString: params.toString(),
    });

    const matchingItems = response.filter(
      (item: any) => item.name.toLowerCase() === context.propsValue.name.toLowerCase()
    );

    if (matchingItems.length === 0) {
      return {
        success: false,
        message: `No tasks found with name: ${name}`,
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
          ? 'Found 1 matching task'
          : `Found ${matchingItems.length} matching tasks`,
    };
  },
});
