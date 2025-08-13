import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const findContact = createAction({
  auth: xeroAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Finds a contact by name or account number in Xero',
  props: {
    tenant_id: props.tenant_id,
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'The name of the contact to search for. Optional.',
      required: false,
    }),
    accountNumber: Property.ShortText({
      displayName: 'Account Number',
      description: 'The account number of the contact to search for. Optional.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { tenant_id, contactName, accountNumber } = propsValue;

    if (!contactName && !accountNumber) {
      throw new Error(
        'You must provide either a Contact Name or an Account Number to search.'
      );
    }

    const queryParams = [];
    if (contactName) {
      queryParams.push(`Name="${encodeURIComponent(contactName)}"`);
    }
    if (accountNumber) {
      queryParams.push(`AccountNumber="${encodeURIComponent(accountNumber)}"`);
    }
    const query = queryParams.join(' AND ');

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/Contacts?where=${query}`,
      null,
      {
        'Xero-Tenant-Id': tenant_id,
      }
    );

    // Return the response
    return {
      success: true,
      contacts: response.Contacts || [],
      message: response.Contacts?.length
        ? `${response.Contacts.length} contact(s) found.`
        : 'No contacts found.',
    };
  },
});
