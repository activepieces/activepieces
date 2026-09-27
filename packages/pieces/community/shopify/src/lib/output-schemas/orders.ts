import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example because the app is not approved for protected customer data.',
};

const countFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  {
    key: 'precision',
    label: 'Precision',
    description: 'EXACT, or AT_LEAST when Shopify capped the count.',
  },
  redactedFieldsField,
];

export const getShopOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Shop ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'contact_email', label: 'Contact Email', format: 'email' },
    { key: 'myshopify_domain', label: 'Myshopify Domain' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'primary_domain_host', label: 'Primary Domain Host' },
    { key: 'primary_domain_url', label: 'Primary Domain URL', format: 'url' },
    { key: 'currency_code', label: 'Currency Code' },
    {
      key: 'enabled_presentment_currencies',
      label: 'Enabled Presentment Currencies',
    },
    { key: 'iana_timezone', label: 'IANA Timezone' },
    { key: 'timezone_abbreviation', label: 'Timezone Abbreviation' },
    { key: 'timezone_offset', label: 'Timezone Offset' },
    { key: 'weight_unit', label: 'Weight Unit' },
    { key: 'unit_system', label: 'Unit System' },
    { key: 'taxes_included', label: 'Taxes Included', format: 'boolean' },
    { key: 'tax_shipping', label: 'Tax Shipping', format: 'boolean' },
    { key: 'plan_name', label: 'Plan Name' },
    {
      key: 'plan_partner_development',
      label: 'Partner Development Plan',
      format: 'boolean',
    },
    { key: 'plan_shopify_plus', label: 'Shopify Plus Plan', format: 'boolean' },
    { key: 'address_city', label: 'Address City' },
    { key: 'address_province_code', label: 'Address Province Code' },
    { key: 'address_country_code', label: 'Address Country Code' },
    { key: 'address_zip', label: 'Address ZIP' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    redactedFieldsField,
  ],
};

export const getGrantedAccessScopesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Scopes',
      labelKey: 'handle',
      listItems: [
        { key: 'handle', label: 'Handle' },
        { key: 'description', label: 'Description' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'handles', label: 'Handles', description: 'Comma-separated scope handles.' },
    redactedFieldsField,
  ],
};

export const countOutputSchema: OutputSchema = { fields: countFields };

export const generateCustomerActivationUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    {
      key: 'account_activation_url',
      label: 'Account Activation URL',
      format: 'url',
    },
    redactedFieldsField,
  ],
};

export const sendCustomerAccountInviteOutputSchema: OutputSchema = {
  fields: [
    { key: 'customer_id', label: 'Customer ID' },
    {
      key: 'state',
      label: 'Account State',
      description: 'Null when Shopify withholds the customer record.',
    },
    redactedFieldsField,
  ],
};

export const addTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Resource ID' },
    { key: 'tags_added', label: 'Tags Added' },
    {
      key: 'tags',
      label: 'Current Tags',
      description: 'Null when Shopify withholds the tagged record.',
    },
    redactedFieldsField,
  ],
};

export const removeTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Resource ID' },
    { key: 'tags_removed', label: 'Tags Removed' },
    {
      key: 'tags',
      label: 'Current Tags',
      description: 'Null when Shopify withholds the tagged record.',
    },
    redactedFieldsField,
  ],
};

export const createOrderRiskAssessmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'risk_level', label: 'Risk Level' },
    { key: 'provider', label: 'Provider' },
    {
      key: 'facts',
      label: 'Facts',
      labelKey: 'description',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'sentiment', label: 'Sentiment' },
      ],
    },
    redactedFieldsField,
  ],
};

export const startOrderCancellationOutputSchema: OutputSchema = {
  fields: [
    { key: 'order_id', label: 'Order ID' },
    { key: 'job_id', label: 'Job ID' },
    { key: 'job_done', label: 'Job Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const getJobOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Job ID' },
    { key: 'done', label: 'Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const deleteOrderOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_id', label: 'Deleted Order ID' },
    redactedFieldsField,
  ],
};

export const deleteDraftOrderOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_id', label: 'Deleted Draft Order ID' },
    redactedFieldsField,
  ],
};

export const deleteCustomerOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_customer_id', label: 'Deleted Customer ID' },
    redactedFieldsField,
  ],
};
