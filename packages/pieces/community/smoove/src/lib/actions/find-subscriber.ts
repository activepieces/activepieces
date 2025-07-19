import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findSubscriber = createAction({
  auth: smooveAuth,
  name: 'findSubscriber',
  displayName: 'Find Subscriber',
  description: '',
  props: {
    id: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The unique ID of the subscriber.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the subscriber.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The external ID of the subscriber.',
      required: false,
    }),
    includeCustomFields: Property.Checkbox({
      displayName: 'Include Custom Fields',
      description: 'Include custom fields in the response.',
      required: false,
      defaultValue: false,
    }),
    includeLinkedLists: Property.Checkbox({
      displayName: 'Include Linked Lists',
      description: 'Include linked lists in the response.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { id, email, phone, externalId, includeCustomFields, includeLinkedLists } = propsValue;
    const filters: string[] = [];
    if (id) filters.push(`id=${encodeURIComponent(id)}`);
    if (email) filters.push(`email=${encodeURIComponent(email)}`);
    if (phone) filters.push(`cell=${encodeURIComponent(phone)}`);
    if (externalId) filters.push(`externalid=${encodeURIComponent(externalId)}`);
    if (includeCustomFields) filters.push('includeCustomFields=true');
    if (includeLinkedLists) filters.push('includeLinkedLists=true');
    const query = filters.length ? '?' + filters.join('&') : '';
    const endpoint = `/Contacts${query}`;

    const response = await makeRequest(auth, HttpMethod.GET, endpoint);

    if (Array.isArray(response) && response.length === 0) {
      return {
        success: false,
        message: 'No subscriber found matching the provided criteria.',
        data: [],
      };
    }
    return {
      success: true,
      message: 'Subscriber(s) found.',
      data: response,
    };
  },
});
