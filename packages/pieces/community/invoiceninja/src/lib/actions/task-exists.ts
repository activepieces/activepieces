import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { invoiceninjaAuth } from '../..';
// 05/09/23 - returns 1 or 0 instead of true or false as was having issues
export const existsTask = createAction({
  auth: invoiceninjaAuth,
  name: 'exists_task',
  displayName: 'Check Task Existence',
  description: 'Verify if a Task Already Exists',
  props: {
    number: Property.LongText({
      displayName: 'Task or Ticket Number (alphanumeric)',
      description: 'A task or ticket number to check',
      required: true,
    }),
  },

  async run(context) {
    const INapiToken = context.auth.access_token;

    const headers = {
      'X-Api-Token': INapiToken,
    };

    const queryParams = new URLSearchParams();
    // number=context.propsValue.number - last update 'number' was also on the const url which
    // was incorrect
    queryParams.append('number', context.propsValue.number || '');

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/tasks?${queryParams.toString()}`;
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };
    try {
      const response = await httpClient.sendRequest(httprequestdata);
      // meta data only present if ticket exists. had issues testing true and false on
      // branch piece so switched to 1 and 0 respectively instead to see if that works
      // better.
      if (response.body.meta.pagination.total > 0) {
        return 1;
      } else {
        return 0;
      }
    } catch (error) {
      // Handle the error when the request fails (status other than 2xx).
      return 'There was a problem getting information from your Invoice Ninja';
    }
  },
});
