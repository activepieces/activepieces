import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { invoiceninjaAuth } from '../..';
export const createTask = createAction({
  auth: invoiceninjaAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a task instance in Invoice Ninja for billing purposes.',

  props: {
    number: Property.LongText({
      displayName: 'Task or Ticket Number (alphanumeric)',
      description:
        'A unique task or ticket number that has not been used before in Invoice Ninja',
      required: true,
    }),
    client_id: Property.LongText({
      displayName: 'Client ID (alphanumeric)',
      description: 'Client ID from Invoice Ninja (optional)',
      required: false,
    }),
    project_id: Property.LongText({
      displayName: 'Project ID (alphanumeric)',
      description: 'Project ID from Invoice Ninja (optional)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description of task',
      description: 'Description of task to be billed',
      required: true,
    }),
    rate: Property.Number({
      displayName: 'Custom hourly rate',
      description: 'Custom hourly rate (optional) otherwise default used',
      required: false,
    }),
  },

  async run(context) {
    const INapiToken = context.auth.access_token;

    const headers = {
      'X-Api-Token': INapiToken,
    };
    const queryParams = new URLSearchParams();
    queryParams.append('number', context.propsValue.number || '');
    queryParams.append('client_id', context.propsValue.client_id || '');
    queryParams.append('project_id', context.propsValue.project_id || '');
    queryParams.append('description', context.propsValue.description || '');
    // bugfix - only append rate if a rate has been specified in the piece
    if (context.propsValue.rate?.valueOf != null) {
      queryParams.append('rate', context.propsValue.rate?.toString() || '0');
    }
    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/tasks?${queryParams.toString()}`;
    const httprequestdata = {
      method: HttpMethod.POST,
      url,
      headers,
    };
    const response = await httpClient.sendRequest(httprequestdata);
    return response.body;
  },
});
