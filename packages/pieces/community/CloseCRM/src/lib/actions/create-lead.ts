import { Property, createAction } from '@activepieces/pieces-framework';
import { closeAuth } from './../../index';
import { makeClient } from '../common/client';
import { CloseCRMLead } from '../common/types';

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
    const { name, contacts, status, customFields } = context.propsValue;
    const apiKey = context.auth;

    const payload: any = {
      name: name,
    };

    const client = makeClient(apiKey);
    const response = await client.post('/lead/', payload);
    if (status) payload.status = status;
    if (customFields) payload.custom = customFields;
    
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        payload.contacts = contacts;
    }

    

    return response.data as CloseCRMLead;
  },

   
  },
);