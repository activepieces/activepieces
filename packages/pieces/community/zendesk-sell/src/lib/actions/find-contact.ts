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
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'Specific contact ID to retrieve',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Search by first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Search by last name',
      required: false,
    }),
    organizationName: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Search by organization',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'Filter by contact owner',
      required: false,
    }),
  },
  async run(context) {
    if (context.propsValue.contactId) {
      const response = await makeZendeskSellRequest<{ data: Contact }>(
        context.auth,
        HttpMethod.GET,
        `/contacts/${context.propsValue.contactId}`
      );

      return {
        success: true,
        contact: response.data,
        count: 1,
      };
    }
    const params = new URLSearchParams();
    if (context.propsValue.email) params.append('email', context.propsValue.email);
    if (context.propsValue.firstName) params.append('first_name', context.propsValue.firstName);
    if (context.propsValue.lastName) params.append('last_name', context.propsValue.lastName);
    if (context.propsValue.organizationName) params.append('organization_name', context.propsValue.organizationName);
    if (context.propsValue.ownerId) params.append('owner_id', context.propsValue.ownerId.toString());

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