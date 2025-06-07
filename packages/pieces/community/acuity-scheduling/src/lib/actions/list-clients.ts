import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest } from '../common';
import { acuityAuth } from '../../index';

export const listClients = createAction({
  name: 'list_clients',
  displayName: 'List Clients',
  description: 'Retrieve a list of clients.',
  auth: acuityAuth,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      description: 'Filter client list by first name, last name, or phone number.',
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    
    if (context.propsValue.search) {
      queryParams['search'] = context.propsValue.search;
    }

    return await makeAcuityRequest(
      context.auth,
      HttpMethod.GET,
      '/clients',
      undefined,
      queryParams
    );
  },
});
