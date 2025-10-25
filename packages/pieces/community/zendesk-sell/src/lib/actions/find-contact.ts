import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Contact } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContactAction = createAction({
  auth: zendeskSellAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Find a contact by email, name, or other identifier',
  props: {
    id: Property.Number({
      displayName: 'Contact ID',
      description: 'Specific contact ID to retrieve',
      required: false,
    }),
  },
  async run(context) {
    if (context.propsValue.id) {
      const response = await makeZendeskSellRequest<{ data: Contact }>(
        context.auth,
        HttpMethod.GET,
        `/contacts/${context.propsValue.id}`
      );

      return {
        success: true,
        contact: response.data,
        count: 1,
      };
    }
    const params = new URLSearchParams();
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await makeZendeskSellRequest<{ items: Contact[] }>(
      context.auth,
      HttpMethod.GET,
      `/contacts${queryString}`
    );

    return {
      success: true,
      contacts: response.items,
      count: response.items.length,
    };
  },
});