import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const findTask = createAction({
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Searches for tasks in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search for tasks by title or description',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tasks to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const response = await client.searchTasks(context.propsValue.query);
    
    // Apply limit if specified
    const tasks = response.data.slice(0, context.propsValue.limit || 10);
    
    return {
      tasks,
      total_found: response.data.length,
      query: context.propsValue.query,
    };
  },
}); 