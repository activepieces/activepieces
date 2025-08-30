import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const findTaskAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Finds an existing task by subject or description',
  props: {
    search_query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description: 'Search by task subject or description',
    }),
  },
  async run(context) {
    const { search_query } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const result = await client.searchTasks(search_query);
    
    return result;
  },
});
