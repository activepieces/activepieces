import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const updateAccountAction = createAction({
  name: 'update_account',
  auth: outsetaAuth,
  displayName: 'Update Account',
  description: 'Update an existing account in Outseta.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
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
    }),
    invoiceNotes: Property.LongText({
      displayName: 'Invoice Notes',
      required: false,
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

    const body: Record<string, unknown> = {};
    if (context.propsValue.name) body['Name'] = context.propsValue.name;
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

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided.');
    }

    return await client.put<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
      body
    );
  },
});
