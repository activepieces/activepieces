import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { cryptolensAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const addCustomer = createAction({
  auth: cryptolensAuth,
  name: 'addCustomer',
  displayName: 'Add Customer',
  description: 'Add a new customer to your Cryptolens account',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the customer (max 100 characters)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the customer (max 100 characters)',
      required: true,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'The company name the customer belongs to (max 100 characters)',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Optional notes field (max 1000 characters)',
      required: false,
    }),
    enableCustomerAssociation: Property.Checkbox({
      displayName: 'Enable Customer Portal',
      description: 'If enabled, a portal link will be returned where the customer can view their licenses',
      required: false,
    }),
    allowActivationManagement: Property.Checkbox({
      displayName: 'Allow Activation Management',
      description: 'If enabled, the customer can activate and deactivate devices through the customer portal',
      required: false,
    }),
    allowMultipleUserAssociation: Property.Checkbox({
      displayName: 'Allow Multiple User Association',
      description: 'If enabled, multiple user accounts can be associated with this customer',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      Name: context.propsValue.name,
      Email: context.propsValue.email,
      CompanyName: context.propsValue.companyName,
    });

    if (context.propsValue.notes) {
      params.append('Notes', context.propsValue.notes);
    }

    if (context.propsValue.enableCustomerAssociation) {
      params.append('EnableCustomerAssociation', 'true');
    }

    if (context.propsValue.allowActivationManagement) {
      params.append('AllowActivationManagement', 'true');
    }

    if (context.propsValue.allowMultipleUserAssociation) {
      params.append('AllowMultipleUserAssociation', 'true');
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/customer/AddCustomer?${params.toString()}`
    );

    return response;
  },
});
