import { Property, createAction } from '@activepieces/pieces-framework';
import { closeAuth } from './../../index';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const createLead = createAction({
  auth: closeAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in Close CRM',
  props: {
    name: Property.ShortText({
      displayName: 'Lead Name',
      description: 'The name of the lead/company',
      required: true,
    }),
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to associate this contact with',
      required: true,
    }),
    contacts: Property.Array({
      displayName: 'Contacts',
      description: 'Array of contact details for this lead',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Contact Name',
          required: true,
        }),
        email: Property.ShortText({
          displayName: 'Email',
          required: false,
        }),
        phone: Property.ShortText({
          displayName: 'Phone',
          required: false,
        }),
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the lead',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'New' },
          { label: 'Contacted', value: 'Contacted' },
          { label: 'Qualified', value: 'Qualified' },
          { label: 'Proposal Sent', value: 'Proposal Sent' },
        ],
      },
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Additional custom fields for the lead',
      required: false,
    }),
  },
  async run(context) {
    const { name, contacts, status, customFields, lead_id } = context.propsValue;

    const payload: any = {
      name: name,
      contacts: contacts,
      status: status,
      custom: customFields,
      lead_id: lead_id,

    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.close.com/api/v1/lead',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.auth}`,
      },
      body: payload,
    });
    return response.body;


  },
});