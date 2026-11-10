import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCustomer,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { customerOutputSchema } from '../../output-schemas/orders';

export const shopifyAiUpdateCustomerProfile = createAction({
  auth: shopifyAuth,
  name: 'update_customer_profile',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Change the name, email, phone, note, tags, locale or tax exemption of a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one customer; fields left empty are not sent and keep their values, and marketing consent is never touched. Sending tags replaces all tags, so use add_tags or remove_tags for single tags. Addresses are changed with the customer address actions. Re-running with the same values is safe. To blank the note or remove every tag, set clear_note or clear_tags instead of sending an empty value.',
    idempotent: true,
  },
  outputSchema: customerOutputSchema,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer id, numeric or "gid://shopify/Customer/…". Find it with search_customers.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email, for example "jane@example.com".',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'New phone in E.164 format, for example "+16135551111".',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name.',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'New internal note. Replaces the existing note.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The complete new tag list. Replaces every existing tag; leave empty to keep the current tags (use clear_tags to remove all).',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Language for customer emails, for example "en" or "fr-CA".',
      required: false,
    }),
    tax_exempt: shopifyProps.booleanChoice({
      displayName: 'Tax Exempt',
      description: 'Set whether the customer is exempt from taxes. Leave empty to keep the current setting.',
    }),
    clear_note: Property.Checkbox({
      displayName: 'Clear Note',
      description: 'Remove the existing note. Leave note empty when using this.',
      required: false,
      defaultValue: false,
    }),
    clear_tags: Property.Checkbox({
      displayName: 'Clear Tags',
      description: 'Remove every tag. Leave tags empty when using this.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const tags = shopifyValues.readStringList(propsValue.tags);
    const patch = shopifyValues.compact({
      email: shopifyValues.nonEmpty(propsValue.email),
      phone: shopifyValues.nonEmpty(propsValue.phone),
      firstName: shopifyValues.nonEmpty(propsValue.first_name),
      lastName: shopifyValues.nonEmpty(propsValue.last_name),
      note: shopifyValues.readClearable({ value: shopifyValues.nonEmpty(propsValue.note), clear: propsValue.clear_note, name: 'note', empty: '' }),
      tags: shopifyValues.readClearable({ value: tags && tags.length > 0 ? tags : undefined, clear: propsValue.clear_tags, name: 'tags', empty: [] }),
      locale: shopifyValues.nonEmpty(propsValue.locale),
      taxExempt: shopifyValues.toBooleanChoice(propsValue.tax_exempt),
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'Customer', id: propsValue.customer_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerUpdate: { customer: GqlCustomer | null } | null;
    }>({
      auth,
      query: `mutation UpdateCustomerProfile($input: CustomerInput!) { customerUpdate(input: $input) { customer { ${shopifyFields.CUSTOMER_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['customerUpdate.customer'],
      variables: { input: { id, ...patch } },
    });
    const customer = data.customerUpdate?.customer;
    if (!customer) {
      throw new Error(`Customer ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapCustomer(customer),
      redacted_fields: redactedFields,
    };
  },
});
