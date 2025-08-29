import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const findTask = createAction({
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Finds an existing task by its unique identifier',
  props: {
    // Required field
    task_id: Property.Number({
      displayName: 'Task ID',
      description: 'The unique ID of the task to retrieve',
      required: true
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    
    const accessToken = (auth as any).access_token;
    if (!accessToken) {
      throw new Error('Access token not found in authentication');
    }
    
    // Build the API URL
    const url = `https://api.crmworkspace.com/v1/tasks/${propsValue.task_id}`;
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.status >= 400) {
        if (response.status === 404) {
          return {
            found: false,
            task: null,
            message: `Task with ID ${propsValue.task_id} not found`
          };
        }
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      // Return the task with metadata
      return {
        found: true,
        task: response.body,
        message: 'Task retrieved successfully'
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          found: false,
          task: null,
          message: `Task with ID ${propsValue.task_id} not found`
        };
      }
      throw new Error(`Failed to find task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});