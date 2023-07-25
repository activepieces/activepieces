import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { invoiceninjaAuth } from '../..';

export const existsTask = createAction({
  auth: invoiceninjaAuth,
  name: 'exists_task',
  displayName: 'Check Task Existence',
  description: 'Verify if a Task Already Exists',
  props: {
    number: Property.LongText({
      displayName: 'Task or Ticket Number (alphanumeric)',
      description: 'A task or ticket number to check',
      required: true
    })
  },

  async run(context) {
    const INapiToken = context.auth.access_token;

    const headers = {
      'X-Api-Token': INapiToken
    };

    const queryParams = new URLSearchParams();
    queryParams.append('number', context.propsValue.number || '');

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/tasks?${queryParams.toString()}`;
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers
    };

    try {
      const response = await httpClient.sendRequest(httprequestdata);
      // Process the successful response here (status 2xx).
      // count is the number of tickets with that number so return true if it is 1.
      if (response.body.meta.pagination.total > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // Handle the error when the request fails (status other than 2xx).
      return 'There was a problem getting information from your Invoice Ninja';
    }
  }
});
