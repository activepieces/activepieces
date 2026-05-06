import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const createAccountAction = createAction({
  name: 'create_account',
  auth: outsetaAuth,
  displayName: 'Create Account',
  description: 'Create a new account in Outseta CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    accountStage: Property.StaticDropdown({
      displayName: 'Account Stage',
      required: false,
      options: {
        options: [
          { label: 'Lead', value: 1 },
          { label: 'Trialing', value: 2 },
          { label: 'Subscribing', value: 3 },
          { label: 'Delinquent', value: 4 },
          { label: 'Cancelling', value: 5 },
          { label: 'Expired', value: 6 },
          { label: 'Demo', value: 7 },
        ],
      },
    }),
    clientIdentifier: Property.ShortText({
      displayName: 'Client Identifier',
      required: false,
      description: 'A custom identifier you assign to this account (e.g. your internal customer ID).',
    }),
    invoiceNotes: Property.LongText({
      displayName: 'Invoice Notes',
      required: false,
      description: 'Notes that appear on invoices sent to this account.',
    }),
    addressLine1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    addressLine2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State/Region',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {
      Name: context.propsValue.name,
    };
    if (context.propsValue.accountStage != null) body['AccountStage'] = context.propsValue.accountStage;
    if (context.propsValue.clientIdentifier) body['ClientIdentifier'] = context.propsValue.clientIdentifier;
    if (context.propsValue.invoiceNotes) body['InvoiceNotes'] = context.propsValue.invoiceNotes;

    const hasAddress = context.propsValue.addressLine1 || context.propsValue.city || context.propsValue.country;
    if (hasAddress) {
      const address: Record<string, unknown> = {};
      if (context.propsValue.addressLine1) address['AddressLine1'] = context.propsValue.addressLine1;
      if (context.propsValue.addressLine2) address['AddressLine2'] = context.propsValue.addressLine2;
      if (context.propsValue.city) address['City'] = context.propsValue.city;
      if (context.propsValue.state) address['State'] = context.propsValue.state;
      if (context.propsValue.postalCode) address['PostalCode'] = context.propsValue.postalCode;
      if (context.propsValue.country) address['Country'] = context.propsValue.country;
      body['BillingAddress'] = address;
    }

    return client.post<unknown>('/api/v1/crm/accounts', body);
  },
});
