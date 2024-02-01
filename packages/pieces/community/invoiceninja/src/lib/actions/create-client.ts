import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { invoiceninjaAuth } from '../..';

export const createClient = createAction({
  auth: invoiceninjaAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Creates a new client in InvoiceNinja.',

  props: {
    client_first_name: Property.LongText({
      displayName: 'Client First Name (alphanumeric)',
      description: 'The contact first name for this client (optional)',
      required: false,
    }),
    client_last_name: Property.ShortText({
      displayName: 'Client Last Name (alphanumeric)',
      description: 'The contact last name for this client (optional)',
      required: false,
    }),
    client_phone: Property.ShortText({
      displayName: 'Client Contact No (alphanumeric)',
      description: 'The contact number for this client (optional)',
      required: false,
    }),
    client_email: Property.ShortText({
      displayName: 'Client e-mail (alphanumeric)',
      description: 'The contact email for this client (compulsory)',
      required: true,
    }),
    client_send_email: Property.Checkbox({
      displayName: 'Send invoices to the client',
      description: 'Should we send invoices to the client by e-mail?',
      defaultValue: false,
      required: true,
    }),
    client_business_name: Property.ShortText({
      displayName: 'Business Name (alphanumeric)',
      description: 'Name of this business or natural person (compulsory)',
      required: true,
    }),
    client_tax_no: Property.ShortText({
      displayName: 'Client Tax Number (alphanumeric)',
      description: 'Leave blank if not a business (optional)',
      required: false,
    }),
    client_private_notes: Property.ShortText({
      displayName: 'Private notes for client',
      description: 'Text not visible for clients (optional)',
      required: false,
    }),
    client_address1: Property.LongText({
      displayName: 'Client address 1 (alphanumeric)',
      description: 'Usually street name and number (compulsory)',
      required: true,
    }),
    client_address2: Property.LongText({
      displayName: 'Client address 2 (alphanumeric)',
      description: 'Additional address details (optional)',
      required: false,
    }),
    client_city: Property.ShortText({
      displayName: 'Client City/Town (alphanumeric)',
      description: 'City or Town name (compulsory)',
      required: true,
    }),
    client_state: Property.ShortText({
      displayName: 'Client State (alphanumeric)',
      description: 'State or county or similar (optional)',
      required: false,
    }),
    client_postcode: Property.ShortText({
      displayName: 'Client Postcode (alphanumeric)',
      description: 'Postal code (optional)',
      required: false,
    }),
  },

  async run(context) {
    const INapiToken = context.auth.access_token;
    const headers = {
      'X-Api-Token': INapiToken,
      'Content-Type': 'application/json',
    };

    const queryParams = new URLSearchParams();
    queryParams.append('name', context.propsValue.client_business_name);
    queryParams.append('private_notes', context.propsValue.client_private_notes || '');
    queryParams.append('address1', context.propsValue.client_address1 || '');
    queryParams.append('address2', context.propsValue.client_address2 || '');
    queryParams.append('city', context.propsValue.client_city || '');
    queryParams.append('state', context.propsValue.client_state || '');
    queryParams.append('postal_code', context.propsValue.client_postcode || '');
    queryParams.append('vat_number', context.propsValue.client_tax_no || '');
    const body = {
      "contacts": {
        "first_name": context.propsValue.client_first_name || "", "last_name": context.propsValue.client_last_name || "",
        "phone": context.propsValue.client_phone || "", "email": context.propsValue.client_email || "", "send_email": context.propsValue.client_send_email || false
      }
    };

    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/clients/?${queryParams.toString()}`;

    const httprequestdata = {
      method: HttpMethod.POST,
      url,
      headers,
      body,
    };

    const response = await httpClient.sendRequest(httprequestdata);
    return response.body;
  },
});
