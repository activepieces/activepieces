import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example the return policy fields when the token lacks read_legal_policies.',
};

const pagingFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
  {
    key: 'end_cursor',
    label: 'End Cursor',
    description: 'Pass back as the cursor to read the next page.',
  },
  redactedFieldsField,
];

const marketRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Market ID' },
  { key: 'name', label: 'Name' },
];

const marketRefWithHandleFields: OutputSchema['fields'] = [
  ...marketRefFields,
  { key: 'handle', label: 'Handle' },
];

const namedRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
];

const regionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Region ID' },
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code', description: 'Country code (for example CA) or subdivision code.' },
];

const returnPolicyRuleFields: OutputSchema['fields'] = [
  {
    key: 'return_rules_enabled',
    label: 'Return Rules Enabled',
    format: 'boolean',
    description: 'False means return rules are off and customers can return items without restrictions.',
  },
  { key: 'can_accept_returns', label: 'Accepts Returns', format: 'boolean' },
  {
    key: 'return_window_days',
    label: 'Return Window (Days)',
    format: 'number',
    description: '-1 means an unlimited return window.',
  },
  {
    key: 'return_window_starting_from',
    label: 'Return Window Starts From',
    description: 'ITEM_DELIVERY_DATE or LAST_ITEM_DELIVERY_DATE.',
  },
  { key: 'extend_window_to_business_day', label: 'Extend To Business Day', format: 'boolean' },
  {
    key: 'edit_rules_enabled',
    label: 'Edit Rules Enabled',
    format: 'boolean',
    description: 'False means customers can request cancellations without restrictions.',
  },
  { key: 'can_accept_edits', label: 'Accepts Edits', format: 'boolean' },
  {
    key: 'edit_window_minutes',
    label: 'Edit Window (Minutes)',
    format: 'number',
    description: '-1 means until fulfillment.',
  },
];

const marketIdentityFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Market ID' },
  { key: 'name', label: 'Name' },
  { key: 'handle', label: 'Handle' },
  { key: 'status', label: 'Status', description: 'ACTIVE or DRAFT.' },
  { key: 'type', label: 'Type', description: 'REGION, LOCATION, COMPANY_LOCATION, CHANNEL or NONE.' },
  { key: 'condition_types', label: 'Condition Types' },
  { key: 'region_application_level', label: 'Region Application Level', description: 'SPECIFIED or ALL.' },
  { key: 'regions', label: 'Regions', labelKey: 'name', listItems: regionFields },
  { key: 'regions_truncated', label: 'Regions Truncated', format: 'boolean' },
];

const marketSummaryFields: OutputSchema['fields'] = [
  ...marketIdentityFields,
  { key: 'parent_markets', label: 'Parent Markets', labelKey: 'name', listItems: marketRefFields },
  { key: 'parent_markets_truncated', label: 'Parent Markets Truncated', format: 'boolean' },
  { key: 'child_markets', label: 'Child Markets', labelKey: 'name', listItems: marketRefFields },
  { key: 'child_markets_truncated', label: 'Child Markets Truncated', format: 'boolean' },
  { key: 'return_policy_profile_id', label: 'Return Policy Profile ID' },
  { key: 'return_policy_profile_name', label: 'Return Policy Profile Name' },
  { key: 'return_policy_profile_is_default', label: 'Uses Default Return Policy', format: 'boolean' },
  { key: 'base_currency_code', label: 'Base Currency' },
  { key: 'local_currencies', label: 'Local Currencies', format: 'boolean' },
  {
    key: 'web_presences',
    label: 'Web Presences',
    labelKey: 'domain_host',
    listItems: [
      { key: 'id', label: 'Web Presence ID' },
      { key: 'subfolder_suffix', label: 'Subfolder Suffix' },
      { key: 'domain_host', label: 'Domain Host' },
    ],
  },
  { key: 'web_presences_truncated', label: 'Web Presences Truncated', format: 'boolean' },
];

const marketDetailFields: OutputSchema['fields'] = [
  ...marketIdentityFields,
  { key: 'location_application_level', label: 'Location Application Level' },
  { key: 'locations', label: 'Locations', labelKey: 'name', listItems: namedRefFields },
  { key: 'locations_truncated', label: 'Locations Truncated', format: 'boolean' },
  { key: 'company_location_application_level', label: 'Company Location Application Level' },
  { key: 'company_locations', label: 'Company Locations', labelKey: 'name', listItems: namedRefFields },
  { key: 'company_locations_truncated', label: 'Company Locations Truncated', format: 'boolean' },
  { key: 'channel_application_level', label: 'Channel Application Level' },
  { key: 'channels', label: 'Channels', labelKey: 'name', listItems: namedRefFields },
  { key: 'channels_truncated', label: 'Channels Truncated', format: 'boolean' },
  { key: 'parent_markets_count', label: 'Parent Markets Count', format: 'number' },
  { key: 'parent_markets', label: 'Parent Markets', labelKey: 'name', listItems: marketRefWithHandleFields },
  { key: 'parent_markets_truncated', label: 'Parent Markets Truncated', format: 'boolean' },
  { key: 'child_markets_count', label: 'Child Markets Count', format: 'number' },
  { key: 'child_markets', label: 'Child Markets', labelKey: 'name', listItems: marketRefWithHandleFields },
  { key: 'child_markets_truncated', label: 'Child Markets Truncated', format: 'boolean' },
  { key: 'base_currency_code', label: 'Base Currency' },
  { key: 'base_currency_name', label: 'Base Currency Name' },
  { key: 'local_currencies', label: 'Local Currencies', format: 'boolean' },
  { key: 'rounding_enabled', label: 'Rounding Enabled', format: 'boolean' },
  { key: 'inclusive_tax_pricing_strategy', label: 'Tax-Inclusive Pricing' },
  { key: 'inclusive_duties_pricing_strategy', label: 'Duties-Inclusive Pricing' },
  { key: 'catalogs_count', label: 'Catalogs Count', format: 'number' },
  {
    key: 'catalogs',
    label: 'Catalogs',
    labelKey: 'title',
    listItems: [
      { key: 'id', label: 'Catalog ID' },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'price_list_id', label: 'Price List ID' },
      { key: 'price_list_name', label: 'Price List Name' },
      { key: 'price_list_currency', label: 'Price List Currency' },
    ],
  },
  { key: 'catalogs_truncated', label: 'Catalogs Truncated', format: 'boolean' },
  {
    key: 'web_presences',
    label: 'Web Presences',
    labelKey: 'domain_host',
    listItems: [
      { key: 'id', label: 'Web Presence ID' },
      { key: 'subfolder_suffix', label: 'Subfolder Suffix' },
      { key: 'domain_host', label: 'Domain Host' },
      { key: 'default_locale', label: 'Default Locale' },
      {
        key: 'root_urls',
        label: 'Root URLs',
        labelKey: 'locale',
        listItems: [
          { key: 'locale', label: 'Locale' },
          { key: 'url', label: 'URL', format: 'url' },
        ],
      },
    ],
  },
  { key: 'web_presences_truncated', label: 'Web Presences Truncated', format: 'boolean' },
  { key: 'return_policy_profile_id', label: 'Return Policy Profile ID' },
  { key: 'return_policy_profile_name', label: 'Return Policy Profile Name' },
  { key: 'return_policy_profile_is_default', label: 'Uses Default Return Policy', format: 'boolean' },
  { key: 'return_policy', label: 'Return Policy', children: returnPolicyRuleFields },
];

const marketRelationshipFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Relationship ID' },
  { key: 'parent_market_id', label: 'Parent Market ID' },
  { key: 'parent_market_name', label: 'Parent Market Name' },
  { key: 'parent_market_handle', label: 'Parent Market Handle' },
  { key: 'child_market_id', label: 'Child Market ID' },
  { key: 'child_market_name', label: 'Child Market Name' },
  { key: 'child_market_handle', label: 'Child Market Handle' },
];

const returnPolicyProfileFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Return Policy Profile ID' },
  { key: 'name', label: 'Name', description: 'Empty for the default profile.' },
  { key: 'is_default', label: 'Is Default', format: 'boolean' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ...returnPolicyRuleFields,
  { key: 'markets', label: 'Markets', labelKey: 'name', listItems: marketRefWithHandleFields },
];

export const listMarketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Markets', labelKey: 'name', listItems: marketSummaryFields },
    ...pagingFields,
  ],
};

export const marketOutputSchema: OutputSchema = {
  fields: [...marketDetailFields, redactedFieldsField],
};

export const listMarketRelationshipsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Market Relationships',
      labelKey: 'child_market_name',
      listItems: marketRelationshipFields,
    },
    {
      key: 'relationships_version',
      label: 'Relationships Version',
      description:
        'Opaque id of the relationship build that was read. It changes after Shopify finishes rebuilding the hierarchy.',
    },
    ...pagingFields,
  ],
};

export const returnPolicyProfileOutputSchema: OutputSchema = {
  fields: [...returnPolicyProfileFields, redactedFieldsField],
};

export const listReturnPolicyProfilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Return Policy Profiles',
      labelKey: 'name',
      listItems: returnPolicyProfileFields,
    },
    ...pagingFields,
  ],
};
