import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL } from '../common';

interface ListClientsProps {
  search?: string;
}

export const listClients = createAction({
  auth: acuitySchedulingAuth,
  name: 'list_clients',
  displayName: 'List Clients',
  description: 'List clients from your Acuity Scheduling account, with an option to search.',
  props: {
    search: Property.ShortText({
      displayName: 'Search Term',
      description: 'Filter client list by first name, last name, or phone number.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as ListClientsProps;
    const { username, password } = context.auth;

    const queryParams: Record<string, string> = {};
    if (props.search) {
      queryParams['search'] = props.search;
    }

    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${API_URL}/clients`,
      queryParams,
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    });
  },
});
