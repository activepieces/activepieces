import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { customPropertiesProp, mergeCustomProperties } from '../common/custom-properties';
import { planUidDropdown } from '../common/dropdowns';

export const createAccountAction = createAction({
  name: 'create_account',
  auth: outsetaAuth,
  displayName: 'Create Account',
  description:
    'Create a new account in Outseta CRM. Optionally start a subscription on a plan in the same call.',
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
    primaryContactPersonUid: Property.ShortText({
      displayName: 'Primary Contact Person UID',
      required: false,
      description:
        'Optional. UID of an existing person to set as primary contact on the new account. Required by Outseta when starting a subscription with a paid plan.',
    }),
    planUid: planUidDropdown({
      displayName: 'Starting Plan',
      description:
        'Optional. If set, the account is created with an active subscription on this plan.',
      refreshers: [],
      required: false,
    }),
    billingRenewalTerm: Property.StaticDropdown({
      displayName: 'Billing Renewal Term',
      required: false,
      defaultValue: 1,
      description:
        'Used only when Starting Plan is set. Defaults to Monthly.',
      options: {
        disabled: false,
        options: [
          { label: 'Monthly', value: 1 },
          { label: 'Annual', value: 2 },
          { label: 'Quarterly', value: 3 },
          { label: 'One-time', value: 4 },
        ],
      },
    }),
    customProperties: customPropertiesProp('Account'),
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

    if (context.propsValue.primaryContactPersonUid) {
      body['PersonAccount'] = [
        {
          Person: { Uid: context.propsValue.primaryContactPersonUid },
          IsPrimary: true,
        },
      ];
    }

    if (context.propsValue.planUid) {
      body['Subscriptions'] = [
        {
          Plan: { Uid: context.propsValue.planUid },
          BillingRenewalTerm: context.propsValue.billingRenewalTerm ?? 1,
        },
      ];
    }

    mergeCustomProperties(body, context.propsValue.customProperties);

    return client.post<unknown>('/api/v1/crm/accounts', body);
  },
});
