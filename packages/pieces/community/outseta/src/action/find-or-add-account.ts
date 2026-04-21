import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { planUidDropdown } from '../common/dropdowns';

export const findOrAddAccountAction = createAction({
  name: 'find_or_add_account',
  auth: outsetaAuth,
  displayName: 'Find or Add Account',
  description:
    'Search for an account by name. If not found, create a new one.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'Account name to search for. If no exact match is found, a new account is created with this name.',
    }),
    accountStage: Property.StaticDropdown({
      displayName: 'Account Stage',
      required: false,
      description: 'The lifecycle stage for the account (used when creating).',
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
      description: 'A custom identifier for this account (e.g. your internal customer ID). Used when creating.',
    }),
    contactEmail: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'Email for the primary contact (used when creating).',
    }),
    contactFirstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    contactLastName: Property.ShortText({
      displayName: 'Last Name',
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
    addressLine3: Property.ShortText({
      displayName: 'Address Line 3',
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
    planUid: planUidDropdown({ required: false, displayName: 'Plan (for subscription)' }),
    billingRenewalTerm: Property.StaticDropdown({
      displayName: 'Billing Renewal Term',
      required: false,
      description: 'Used when creating a new account with a plan.',
      options: {
        options: [
          { label: 'Monthly', value: 1 },
          { label: 'Yearly', value: 2 },
        ],
      },
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const searchResult = await client.get<any>(
      `/api/v1/crm/accounts?Name=${encodeURIComponent(context.propsValue.name)}&$top=100`
    );

    const items = searchResult?.items ?? searchResult?.Items ?? [];
    const exactMatch = items.find(
      (item: any) =>
        item.Name?.toLowerCase() === context.propsValue.name.toLowerCase()
    );
    if (exactMatch) {
      return {
        created: false,
        uid: exactMatch.Uid ?? null,
        name: exactMatch.Name ?? null,
        account_stage: exactMatch.AccountStage ?? null,
        account_stage_label: exactMatch.AccountStageLabel ?? null,
        client_identifier: exactMatch.ClientIdentifier ?? null,
        primary_contact_email: exactMatch.PrimaryContact?.Email ?? null,
        created_at: exactMatch.Created ?? null,
        updated_at: exactMatch.Updated ?? null,
      };
    }

    const body: Record<string, unknown> = {
      Name: context.propsValue.name,
    };

    if (context.propsValue.accountStage != null) {
      body['AccountStage'] = context.propsValue.accountStage;
    }
    if (context.propsValue.clientIdentifier) {
      body['ClientIdentifier'] = context.propsValue.clientIdentifier;
    }

    const hasAddress = context.propsValue.addressLine1 || context.propsValue.city || context.propsValue.country;
    if (hasAddress) {
      const address: Record<string, unknown> = {};
      if (context.propsValue.addressLine1) address['AddressLine1'] = context.propsValue.addressLine1;
      if (context.propsValue.addressLine2) address['AddressLine2'] = context.propsValue.addressLine2;
      if (context.propsValue.addressLine3) address['AddressLine3'] = context.propsValue.addressLine3;
      if (context.propsValue.city) address['City'] = context.propsValue.city;
      if (context.propsValue.state) address['State'] = context.propsValue.state;
      if (context.propsValue.postalCode) address['PostalCode'] = context.propsValue.postalCode;
      if (context.propsValue.country) address['Country'] = context.propsValue.country;
      body['BillingAddress'] = address;
    }

    if (context.propsValue.contactEmail) {
      const person: Record<string, unknown> = {
        Email: context.propsValue.contactEmail,
      };
      if (context.propsValue.contactFirstName) person['FirstName'] = context.propsValue.contactFirstName;
      if (context.propsValue.contactLastName) person['LastName'] = context.propsValue.contactLastName;
      body['PersonAccount'] = [{ Person: person, IsPrimary: true }];
    }

    if (context.propsValue.planUid) {
      body['Subscriptions'] = [
        {
          Plan: { Uid: context.propsValue.planUid },
          ...(context.propsValue.billingRenewalTerm != null
            ? { BillingRenewalTerm: context.propsValue.billingRenewalTerm }
            : {}),
        },
      ];
    }

    const newAccount = await client.post<any>('/api/v1/crm/accounts', body);

    return {
      created: true,
      uid: newAccount.Uid ?? null,
      name: newAccount.Name ?? null,
      account_stage: newAccount.AccountStage ?? null,
      account_stage_label: newAccount.AccountStageLabel ?? null,
      client_identifier: newAccount.ClientIdentifier ?? null,
      primary_contact_email: newAccount.PrimaryContact?.Email ?? null,
      created_at: newAccount.Created ?? null,
      updated_at: newAccount.Updated ?? null,
    };
  },
});
