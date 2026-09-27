import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCustomer,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { customerOutputSchema } from '../../output-schemas/orders';

export const shopifyAiCreateCustomerProfile = createAction({
  auth: shopifyAuth,
  name: 'create_customer_profile',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Create a customer with contact details, tags and optional email marketing consent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a customer with name, email, phone, note, tags and locale, optionally recording email marketing consent. Search first with search_customers, because Shopify rejects a duplicate email or phone. Add addresses afterwards with create_customer_address. Each call creates a new customer, so retries fail or duplicate.',
    idempotent: false,
  },
  outputSchema: customerOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email, for example "jane@example.com". Must be unique in the store.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Customer phone in E.164 format, for example "+16135551111". Must be unique in the store.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name.',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Internal note about the customer.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to set, for example ["vip", "wholesale"].',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Language for customer emails, for example "en" or "fr-CA".',
      required: false,
    }),
    tax_exempt: Property.Checkbox({
      displayName: 'Tax Exempt',
      description: 'Whether the customer is exempt from taxes. Off by default.',
      required: false,
      defaultValue: false,
    }),
    email_marketing_state: Property.StaticDropdown({
      displayName: 'Email Marketing Consent',
      description:
        'Record the email marketing consent the customer gave. Leave empty to record none (the customer is not subscribed). Requires an email.',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'SUBSCRIBED' },
          { label: 'Not subscribed', value: 'NOT_SUBSCRIBED' },
          { label: 'Unsubscribed', value: 'UNSUBSCRIBED' },
          { label: 'Pending confirmation', value: 'PENDING' },
        ],
      },
    }),
    email_marketing_opt_in_level: Property.StaticDropdown({
      displayName: 'Email Opt-in Level',
      description: 'How consent was collected. Only used with email marketing consent.',
      required: false,
      options: {
        options: [
          { label: 'Single opt-in', value: 'SINGLE_OPT_IN' },
          { label: 'Confirmed opt-in', value: 'CONFIRMED_OPT_IN' },
          { label: 'Unknown', value: 'UNKNOWN' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const email = shopifyValues.nonEmpty(propsValue.email);
    const phone = shopifyValues.nonEmpty(propsValue.phone);
    const firstName = shopifyValues.nonEmpty(propsValue.first_name);
    const lastName = shopifyValues.nonEmpty(propsValue.last_name);
    if (!email && !phone && !firstName && !lastName) {
      throw new Error('Provide at least an email, a phone, a first name or a last name.');
    }
    const marketingState = propsValue.email_marketing_state;
    if (marketingState && !email) {
      throw new Error('Email marketing consent needs an email.');
    }
    const input = shopifyValues.compact({
      email,
      phone,
      firstName,
      lastName,
      note: shopifyValues.nonEmpty(propsValue.note),
      tags: shopifyValues.readStringList(propsValue.tags),
      locale: shopifyValues.nonEmpty(propsValue.locale),
      taxExempt: propsValue.tax_exempt ?? false,
      emailMarketingConsent: marketingState
        ? shopifyValues.compact({
            marketingState,
            marketingOptInLevel: propsValue.email_marketing_opt_in_level,
          })
        : undefined,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerCreate: { customer: GqlCustomer | null } | null;
    }>({
      auth,
      query: `mutation CreateCustomerProfile($input: CustomerInput!) { customerCreate(input: $input) { customer { ${shopifyFields.CUSTOMER_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['customerCreate.customer'],
      variables: { input },
    });
    const customer = data.customerCreate?.customer;
    if (!customer) {
      throw new Error('Shopify did not return the created customer.');
    }
    return {
      ...shopifyMappers.mapCustomer(customer),
      redacted_fields: redactedFields,
    };
  },
});
