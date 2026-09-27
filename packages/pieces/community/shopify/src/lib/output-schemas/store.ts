import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example because the app is not approved for protected customer data.',
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

const countOnlyFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  redactedFieldsField,
];

const scriptTagFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Script Tag ID' },
  { key: 'legacy_resource_id', label: 'Legacy Resource ID' },
  { key: 'src', label: 'Script URL', format: 'url' },
  {
    key: 'display_scope',
    label: 'Display Scope',
    description: 'ONLINE_STORE, ORDER_STATUS or ALL.',
  },
  { key: 'cache', label: 'Cached', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const marketingActivityFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Marketing Activity ID' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'status_label', label: 'Status Label' },
  { key: 'tactic', label: 'Tactic' },
  { key: 'marketing_channel_type', label: 'Channel Type' },
  { key: 'source_and_medium', label: 'Source and Medium' },
  { key: 'is_external', label: 'Is External', format: 'boolean' },
  { key: 'hierarchy_level', label: 'Hierarchy Level' },
  { key: 'parent_remote_id', label: 'Parent Remote ID' },
  { key: 'parent_activity_id', label: 'Parent Activity ID' },
  { key: 'url_parameter_value', label: 'URL Parameter Value' },
  { key: 'activity_list_url', label: 'Activity List URL', format: 'url' },
  { key: 'utm_campaign', label: 'UTM Campaign' },
  { key: 'utm_source', label: 'UTM Source' },
  { key: 'utm_medium', label: 'UTM Medium' },
  { key: 'budget_type', label: 'Budget Type', description: 'DAILY or LIFETIME.' },
  { key: 'budget_amount', label: 'Budget Amount', format: 'number' },
  { key: 'budget_currency_code', label: 'Budget Currency' },
  { key: 'ad_spend_amount', label: 'Ad Spend Amount', format: 'number' },
  { key: 'ad_spend_currency_code', label: 'Ad Spend Currency' },
  { key: 'marketing_event_id', label: 'Marketing Event ID' },
  { key: 'remote_id', label: 'Remote ID' },
  { key: 'manage_url', label: 'Manage URL', format: 'url' },
  { key: 'preview_url', label: 'Preview URL', format: 'url' },
  { key: 'started_at', label: 'Started At', format: 'datetime' },
  { key: 'ended_at', label: 'Ended At', format: 'datetime' },
  { key: 'scheduled_to_end_at', label: 'Scheduled To End At', format: 'datetime' },
  { key: 'status_transitioned_at', label: 'Status Changed At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const marketingEventFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Marketing Event ID' },
  { key: 'legacy_resource_id', label: 'Legacy Resource ID' },
  { key: 'type', label: 'Type' },
  { key: 'remote_id', label: 'Remote ID' },
  { key: 'description', label: 'Description' },
  { key: 'marketing_channel_type', label: 'Channel Type' },
  { key: 'source_and_medium', label: 'Source and Medium' },
  { key: 'channel_handle', label: 'Channel Handle' },
  { key: 'started_at', label: 'Started At', format: 'datetime' },
  { key: 'ended_at', label: 'Ended At', format: 'datetime' },
  { key: 'scheduled_to_end_at', label: 'Scheduled To End At', format: 'datetime' },
  { key: 'manage_url', label: 'Manage URL', format: 'url' },
  { key: 'preview_url', label: 'Preview URL', format: 'url' },
  { key: 'utm_campaign', label: 'UTM Campaign' },
  { key: 'utm_medium', label: 'UTM Medium' },
  { key: 'utm_source', label: 'UTM Source' },
  { key: 'app_id', label: 'App ID' },
  { key: 'app_title', label: 'App Title' },
];

const eventFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Event ID' },
  { key: 'event_type', label: 'Event Type', description: 'BasicEvent or CommentEvent.' },
  { key: 'action', label: 'Action' },
  { key: 'message', label: 'Message', format: 'html' },
  { key: 'secondary_message', label: 'Secondary Message' },
  { key: 'raw_message', label: 'Raw Message' },
  { key: 'subject_id', label: 'Subject ID' },
  { key: 'subject_type', label: 'Subject Type' },
  { key: 'author', label: 'Author' },
  { key: 'app_title', label: 'App Title' },
  { key: 'attribute_to_app', label: 'Attributed To App', format: 'boolean' },
  { key: 'attribute_to_user', label: 'Attributed To User', format: 'boolean' },
  { key: 'critical_alert', label: 'Critical Alert', format: 'boolean' },
  { key: 'edited', label: 'Edited', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const bulkOperationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Bulk Operation ID' },
  {
    key: 'status',
    label: 'Status',
    description: 'CREATED, RUNNING, COMPLETED, CANCELING, CANCELED, FAILED or EXPIRED.',
  },
  { key: 'type', label: 'Type', description: 'QUERY or MUTATION.' },
  { key: 'error_code', label: 'Error Code' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'object_count', label: 'Object Count', format: 'number' },
  { key: 'root_object_count', label: 'Root Object Count', format: 'number' },
  { key: 'file_size', label: 'File Size', format: 'filesize' },
  {
    key: 'url',
    label: 'Result File URL',
    format: 'url',
    description: 'JSONL result file, set once the operation completes.',
  },
  { key: 'partial_data_url', label: 'Partial Data URL', format: 'url' },
  { key: 'query', label: 'Query' },
];

const rootUrlFields: OutputSchema['fields'] = [
  { key: 'locale', label: 'Locale' },
  { key: 'url', label: 'URL', format: 'url' },
];

const businessEntityFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Business Entity ID' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'primary', label: 'Primary', format: 'boolean' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'legal_entity_id', label: 'Legal Entity ID' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'zip', label: 'ZIP' },
  { key: 'country_code', label: 'Country Code' },
];

const consentPolicyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Policy ID' },
  { key: 'country_code', label: 'Country Code' },
  {
    key: 'region_code',
    label: 'Region Code',
    description: 'Full ISO 3166-2 code such as USCA, or null for a country-wide policy.',
  },
  { key: 'consent_required', label: 'Consent Required', format: 'boolean' },
  {
    key: 'data_sale_opt_out_required',
    label: 'Data Sale Opt-Out Required',
    format: 'boolean',
  },
  { key: 'shop_id', label: 'Shop ID' },
];

const catalogFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Catalog ID' },
  {
    key: 'catalog_type',
    label: 'Catalog Type',
    description: 'AppCatalog, MarketCatalog or CompanyLocationCatalog.',
  },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'price_list_id', label: 'Price List ID' },
  { key: 'price_list_name', label: 'Price List Name' },
  { key: 'price_list_currency', label: 'Price List Currency' },
  { key: 'publication_id', label: 'Publication ID' },
  { key: 'markets_count', label: 'Markets Count', format: 'number' },
  { key: 'company_locations_count', label: 'Company Locations Count', format: 'number' },
];

const webPresenceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Web Presence ID' },
  { key: 'kind', label: 'Kind', description: 'domain or subfolder.' },
  { key: 'subfolder_suffix', label: 'Subfolder Suffix' },
  { key: 'domain_id', label: 'Domain ID' },
  { key: 'domain_host', label: 'Domain Host' },
  { key: 'domain_url', label: 'Domain URL', format: 'url' },
  { key: 'default_locale', label: 'Default Locale' },
  { key: 'root_urls', label: 'Root URLs', labelKey: 'locale', listItems: rootUrlFields },
];

const customerAccountPageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID' },
  {
    key: 'page_kind',
    label: 'Page Kind',
    description: 'CustomerAccountNativePage or CustomerAccountAppExtensionPage.',
  },
  { key: 'handle', label: 'Handle' },
  { key: 'title', label: 'Title' },
  { key: 'default_cursor', label: 'Default Cursor' },
  { key: 'page_type', label: 'Page Type' },
  { key: 'app_extension_uuid', label: 'App Extension UUID' },
];

const savedSearchFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Saved Search ID' },
  { key: 'name', label: 'Name' },
  { key: 'query', label: 'Query' },
  { key: 'search_terms', label: 'Search Terms' },
  { key: 'resource_type', label: 'Resource Type' },
];

const paymentTermsTemplateFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Template ID' },
  { key: 'name', label: 'Name' },
  { key: 'translated_name', label: 'Translated Name' },
  { key: 'description', label: 'Description' },
  { key: 'due_in_days', label: 'Due In Days', format: 'number' },
  {
    key: 'payment_terms_type',
    label: 'Payment Terms Type',
    description: 'RECEIPT, NET, FIXED or FULFILLMENT.',
  },
];

const shopPolicyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Policy ID' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'body', label: 'Body', format: 'html' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const storeCountOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'precision',
      label: 'Precision',
      description: 'EXACT, or AT_LEAST when Shopify capped the count.',
    },
    redactedFieldsField,
  ],
};

export const scriptTagOutputSchema: OutputSchema = {
  fields: [...scriptTagFields, redactedFieldsField],
};

export const listScriptTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Script Tags', labelKey: 'src', listItems: scriptTagFields },
    ...pagingFields,
  ],
};

export const deleteScriptTagOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_script_tag_id', label: 'Deleted Script Tag ID' },
    redactedFieldsField,
  ],
};

export const marketingActivityOutputSchema: OutputSchema = {
  fields: [...marketingActivityFields, redactedFieldsField],
};

export const deleteMarketingActivityOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_marketing_activity_id', label: 'Deleted Marketing Activity ID' },
    { key: 'remote_id', label: 'Remote ID' },
    {
      key: 'deletion_queued',
      label: 'Deletion Queued',
      format: 'boolean',
      description: 'True when Shopify finishes the deletion in the background.',
    },
    redactedFieldsField,
  ],
};

export const marketingEngagementOutputSchema: OutputSchema = {
  fields: [
    { key: 'occurred_on', label: 'Occurred On', format: 'date' },
    { key: 'utc_offset', label: 'UTC Offset' },
    { key: 'channel_handle', label: 'Channel Handle' },
    { key: 'marketing_activity_id', label: 'Marketing Activity ID' },
    { key: 'marketing_activity_title', label: 'Marketing Activity Title' },
    { key: 'impressions_count', label: 'Impressions', format: 'number' },
    { key: 'views_count', label: 'Views', format: 'number' },
    { key: 'clicks_count', label: 'Clicks', format: 'number' },
    { key: 'shares_count', label: 'Shares', format: 'number' },
    { key: 'favorites_count', label: 'Favorites', format: 'number' },
    { key: 'comments_count', label: 'Comments', format: 'number' },
    { key: 'unsubscribes_count', label: 'Unsubscribes', format: 'number' },
    { key: 'complaints_count', label: 'Complaints', format: 'number' },
    { key: 'fails_count', label: 'Fails', format: 'number' },
    { key: 'sends_count', label: 'Sends', format: 'number' },
    { key: 'unique_views_count', label: 'Unique Views', format: 'number' },
    { key: 'unique_clicks_count', label: 'Unique Clicks', format: 'number' },
    { key: 'sessions_count', label: 'Sessions', format: 'number' },
    { key: 'orders', label: 'Orders', format: 'number' },
    { key: 'first_time_customers', label: 'First-Time Customers', format: 'number' },
    { key: 'returning_customers', label: 'Returning Customers', format: 'number' },
    { key: 'primary_conversions', label: 'Primary Conversions', format: 'number' },
    { key: 'all_conversions', label: 'All Conversions', format: 'number' },
    { key: 'ad_spend_amount', label: 'Ad Spend Amount', format: 'number' },
    { key: 'ad_spend_currency_code', label: 'Ad Spend Currency' },
    { key: 'sales_amount', label: 'Sales Amount', format: 'number' },
    { key: 'sales_currency_code', label: 'Sales Currency' },
    redactedFieldsField,
  ],
};

export const marketingEventOutputSchema: OutputSchema = {
  fields: [...marketingEventFields, redactedFieldsField],
};

export const listMarketingEventsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Marketing Events',
      labelKey: 'description',
      listItems: marketingEventFields,
    },
    ...pagingFields,
  ],
};

export const eventOutputSchema: OutputSchema = {
  fields: [...eventFields, redactedFieldsField],
};

export const listEventsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Events', labelKey: 'message', listItems: eventFields },
    ...pagingFields,
  ],
};

export const bulkOperationOutputSchema: OutputSchema = {
  fields: [...bulkOperationFields, redactedFieldsField],
};

export const startBulkQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'bulk_operation_id', label: 'Bulk Operation ID' },
    ...bulkOperationFields.filter((field) => field.key !== 'id'),
    redactedFieldsField,
  ],
};

export const startBulkMutationOutputSchema: OutputSchema = {
  fields: [
    { key: 'bulk_operation_id', label: 'Bulk Operation ID' },
    ...bulkOperationFields.filter((field) => field.key !== 'id'),
    { key: 'line_count', label: 'Line Count', format: 'number' },
    { key: 'staged_upload_path', label: 'Staged Upload Path' },
    redactedFieldsField,
  ],
};

export const listBulkOperationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Bulk Operations', labelKey: 'id', listItems: bulkOperationFields },
    ...pagingFields,
  ],
};

export const listShopPoliciesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Policies', labelKey: 'title', listItems: shopPolicyFields },
    ...countOnlyFields,
  ],
};

export const listAvailableLocalesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Locales',
      labelKey: 'name',
      listItems: [
        { key: 'iso_code', label: 'ISO Code' },
        { key: 'name', label: 'Name' },
      ],
    },
    ...countOnlyFields,
  ],
};

export const domainOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Domain ID' },
    { key: 'host', label: 'Host' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'ssl_enabled', label: 'SSL Enabled', format: 'boolean' },
    { key: 'default_locale', label: 'Default Locale' },
    { key: 'alternate_locales', label: 'Alternate Locales' },
    { key: 'country', label: 'Country' },
    { key: 'web_presence_id', label: 'Web Presence ID' },
    { key: 'web_presence_subfolder_suffix', label: 'Web Presence Subfolder Suffix' },
    {
      key: 'web_presence_root_urls',
      label: 'Web Presence Root URLs',
      labelKey: 'locale',
      listItems: rootUrlFields,
    },
    redactedFieldsField,
  ],
};

export const shopBillingPreferencesOutputSchema: OutputSchema = {
  fields: [{ key: 'billing_currency', label: 'Billing Currency' }, redactedFieldsField],
};

export const listCustomerAccountPagesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Customer Account Pages',
      labelKey: 'title',
      listItems: customerAccountPageFields,
    },
    ...pagingFields,
  ],
};

export const listSavedSearchesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Saved Searches', labelKey: 'name', listItems: savedSearchFields },
    ...pagingFields,
  ],
};

export const deleteSavedSearchOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_saved_search_id', label: 'Deleted Saved Search ID' },
    redactedFieldsField,
  ],
};

export const listConsentPoliciesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Consent Policies',
      labelKey: 'country_code',
      listItems: consentPolicyFields,
    },
    ...countOnlyFields,
  ],
};

export const listConsentPolicyRegionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Regions',
      labelKey: 'country_code',
      listItems: [
        { key: 'country_code', label: 'Country Code' },
        { key: 'region_code', label: 'Region Code' },
      ],
    },
    ...countOnlyFields,
  ],
};

export const listCatalogsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Catalogs', labelKey: 'title', listItems: catalogFields },
    ...pagingFields,
  ],
};

export const businessEntityOutputSchema: OutputSchema = {
  fields: [...businessEntityFields, redactedFieldsField],
};

export const listBusinessEntitiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Business Entities',
      labelKey: 'display_name',
      listItems: businessEntityFields,
    },
    ...countOnlyFields,
  ],
};

export const listWebPresencesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Web Presences', labelKey: 'kind', listItems: webPresenceFields },
    ...pagingFields,
  ],
};

export const deleteWebPresenceOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_web_presence_id', label: 'Deleted Web Presence ID' },
    redactedFieldsField,
  ],
};

export const listPaymentTermsTemplatesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Payment Terms Templates',
      labelKey: 'name',
      listItems: paymentTermsTemplateFields,
    },
    ...countOnlyFields,
  ],
};
