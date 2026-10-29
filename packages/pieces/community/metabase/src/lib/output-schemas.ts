import { OutputSchema } from '@activepieces/pieces-framework';

const parametersFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'type', label: 'Type' },
];

const dashboardFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'moderation_status', label: 'Moderation Status' },
];

const parameterMappingsFields: OutputSchema['fields'] = [
  { key: 'target', label: 'Target' },
  { key: 'card_id', label: 'Card ID', format: 'number' },
  { key: 'parameter_id', label: 'Parameter ID' },
];

const parametersFields2: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'type', label: 'Type' },
  { key: 'target', label: 'Target' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'common_name', label: 'Common Name' },
];

const creatorFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'common_name', label: 'Common Name' },
];

const metadataSyncFields: OutputSchema['fields'] = [
  { key: 'schedule_minute', label: 'Schedule Minute', format: 'number' },
  { key: 'schedule_day', label: 'Schedule Day' },
  { key: 'schedule_frame', label: 'Schedule Frame' },
  { key: 'schedule_hour', label: 'Schedule Hour' },
  { key: 'schedule_type', label: 'Schedule Type' },
];

const parametersFields3: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'type', label: 'Type' },
  { key: 'target', label: 'Target' },
  { key: 'values_source_type', label: 'Values Source Type' },
  { key: 'values_source_config', label: 'Values Source Config' },
];

const cacheFieldValuesFields: OutputSchema['fields'] = [
  { key: 'schedule_minute', label: 'Schedule Minute', format: 'number' },
  { key: 'schedule_day', label: 'Schedule Day' },
  { key: 'schedule_frame', label: 'Schedule Frame' },
  { key: 'schedule_hour', label: 'Schedule Hour', format: 'number' },
  { key: 'schedule_type', label: 'Schedule Type' },
];

const subscriptionsFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'notification_id', label: 'Notification ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'event_name', label: 'Event Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'cron_schedule', label: 'Cron Schedule' },
  { key: 'ui_display_type', label: 'Ui Display Type' },
];

const collectionFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'description', label: 'Description' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'slug', label: 'Slug' },
  { key: 'personal_owner_id', label: 'Personal Owner ID' },
  { key: 'type', label: 'Type' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'location', label: 'Location' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const collectionFields2: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'slug', label: 'Slug' },
  { key: 'name', label: 'Name' },
  { key: 'personal_owner_id', label: 'Personal Owner ID' },
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'ID' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'location', label: 'Location' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const collectionFields3: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'slug', label: 'Slug' },
  { key: 'name', label: 'Name' },
  { key: 'personal_owner_id', label: 'Personal Owner ID' },
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'location', label: 'Location' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const creatorFields2: OutputSchema['fields'] = [
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'is_data_analyst', label: 'Is Data Analyst', format: 'boolean' },
  { key: 'last_login', label: 'Last Login' },
  { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'date_joined', label: 'Date Joined', format: 'datetime' },
  { key: 'common_name', label: 'Common Name' },
];

const colsFields: OutputSchema['fields'] = [
  { key: 'database_type', label: 'Database Type' },
  { key: 'lib/deduplicated-name', label: 'Lib Deduplicated Name' },
  { key: 'lib/original-name', label: 'Lib Original Name' },
  { key: 'name', label: 'Name' },
  { key: 'lib/source', label: 'Lib Source' },
  { key: 'lib/source-column-alias', label: 'Lib Source Column Alias' },
  { key: 'source', label: 'Source' },
  { key: 'field_ref', label: 'Field Ref' },
  { key: 'effective_type', label: 'Effective Type' },
  { key: 'lib/desired-column-alias', label: 'Lib Desired Column Alias' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'base_type', label: 'Base Type' },
];

const eventsFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'creator', label: 'Creator' },
  { key: 'time_matters', label: 'Time Matters', format: 'boolean' },
  { key: 'name', label: 'Name' },
  { key: 'timeline_id', label: 'Timeline ID', format: 'number' },
  { key: 'icon', label: 'Icon' },
  { key: 'creator_id', label: 'Creator ID', format: 'number' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const cardsFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'format_rows', label: 'Format Rows', format: 'boolean' },
  { key: 'include_xls', label: 'Include XLS', format: 'boolean' },
  { key: 'dashboard_card_id', label: 'Dashboard Card ID', format: 'number' },
  { key: 'collection_id', label: 'Collection ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'pivot_results', label: 'Pivot Results', format: 'boolean' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'parameter_mappings', label: 'Parameter Mappings' },
  { key: 'include_csv', label: 'Include CSV', format: 'boolean' },
  { key: 'display', label: 'Display' },
  { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
];

const channelsFields: OutputSchema['fields'] = [
  { key: 'schedule_type', label: 'Schedule Type' },
  { key: 'schedule_hour', label: 'Schedule Hour', format: 'number' },
  { key: 'channel_type', label: 'Channel Type' },
  { key: 'schedule_frame', label: 'Schedule Frame' },
  {
    key: 'recipients',
    label: 'Recipients',
    labelKey: 'email',
    listItems: [{ key: 'email', label: 'Email', format: 'email' }],
  },
  { key: 'channel_id', label: 'Channel ID' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'pulse_id', label: 'Pulse ID', format: 'number' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'schedule_day', label: 'Schedule Day' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'enabled', label: 'Enabled', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const dbFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'features', label: 'Features' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'auto_run_queries', label: 'Auto Run Queries', format: 'boolean' },
  { key: 'is_stub', label: 'Is Stub', format: 'boolean' },
  { key: 'name', label: 'Name' },
  { key: 'caveats', label: 'Caveats' },
  { key: 'creator_id', label: 'Creator ID', format: 'number' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'provider_name', label: 'Provider Name' },
  { key: 'cache_ttl', label: 'Cache TTL' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'engine', label: 'Engine' },
  { key: 'refingerprint', label: 'Refingerprint' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'points_of_interest', label: 'Points Of Interest' },
  { key: 'admin_details', label: 'Admin Details' },
];

const colsFields2: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'database_type', label: 'Database Type' },
  { key: 'semantic_type', label: 'Semantic Type' },
  { key: 'table_id', label: 'Table ID', format: 'number' },
  { key: 'lib/deduplicated-name', label: 'Lib Deduplicated Name' },
  { key: 'lib/original-name', label: 'Lib Original Name' },
  { key: 'name', label: 'Name' },
  { key: 'lib/source', label: 'Lib Source' },
  { key: 'lib/source-column-alias', label: 'Lib Source Column Alias' },
  { key: 'lib/original-display-name', label: 'Lib Original Display Name' },
  { key: 'source', label: 'Source' },
  { key: 'field_ref', label: 'Field Ref' },
  { key: 'effective_type', label: 'Effective Type' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'lib/desired-column-alias', label: 'Lib Desired Column Alias' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'visibility_type', label: 'Visibility Type' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'base_type', label: 'Base Type' },
];

const dataFields: OutputSchema['fields'] = [
  { key: 'rows', label: 'Rows' },
  { key: 'cols', label: 'Cols', labelKey: 'name', listItems: colsFields2 },
  { key: 'native_form', label: 'Native Form' },
  { key: 'results_timezone', label: 'Results Timezone' },
];

const metricsFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'table_id', label: 'Table ID', format: 'number' },
  { key: 'database_id', label: 'Database ID', format: 'number' },
  { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
  { key: 'collection_id', label: 'Collection ID', format: 'number' },
  { key: 'query_type', label: 'Query Type' },
  { key: 'name', label: 'Name' },
  { key: 'document_id', label: 'Document ID' },
  { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
  { key: 'type', label: 'Type' },
  { key: 'creator_id', label: 'Creator ID', format: 'number' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'embedding_params', label: 'Embedding Params' },
  { key: 'cache_ttl', label: 'Cache TTL' },
  { key: 'dataset_query', label: 'Dataset Query' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'parameter_mappings', label: 'Parameter Mappings' },
  { key: 'display', label: 'Display' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'parameters', label: 'Parameters' },
  { key: 'dashboard_id', label: 'Dashboard ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'public_uuid', label: 'Public UUID' },
];

const fieldsFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'database_type', label: 'Database Type' },
  { key: 'semantic_type', label: 'Semantic Type' },
  { key: 'table_id', label: 'Table ID', format: 'number' },
  { key: 'coercion_strategy', label: 'Coercion Strategy' },
  { key: 'database_indexed', label: 'Database Indexed' },
  {
    key: 'dimension_interestingness',
    label: 'Dimension Interestingness',
    format: 'number',
  },
  { key: 'name', label: 'Name' },
  {
    key: 'fingerprint_version',
    label: 'Fingerprint Version',
    format: 'number',
  },
  { key: 'has_field_values', label: 'Has Field Values' },
  { key: 'database_is_pk', label: 'Database Is PK' },
  { key: 'caveats', label: 'Caveats' },
  { key: 'fk_target_field_id', label: 'FK Target Field ID', format: 'number' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'custom_position', label: 'Custom Position', format: 'number' },
  { key: 'database_default', label: 'Database Default' },
  { key: 'effective_type', label: 'Effective Type' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'parent_id', label: 'Parent ID' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'last_analyzed', label: 'Last Analyzed' },
  { key: 'database_partitioned', label: 'Database Partitioned' },
  {
    key: 'database_is_auto_increment',
    label: 'Database Is Auto Increment',
    format: 'boolean',
  },
  { key: 'json_unfolding', label: 'JSON Unfolding', format: 'boolean' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'visibility_type', label: 'Visibility Type' },
  { key: 'target', label: 'Target' },
  { key: 'preview_display', label: 'Preview Display', format: 'boolean' },
  { key: 'database_is_generated', label: 'Database Is Generated' },
  { key: 'data_sensitivity', label: 'Data Sensitivity' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'database_position', label: 'Database Position', format: 'number' },
  { key: 'database_required', label: 'Database Required', format: 'boolean' },
  { key: 'database_is_nullable', label: 'Database Is Nullable' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'base_type', label: 'Base Type' },
  { key: 'points_of_interest', label: 'Points Of Interest' },
];

const tablesFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'schema', label: 'Schema' },
  { key: 'is_writable', label: 'Is Writable' },
  { key: 'database_require_filter', label: 'Database Require Filter' },
  { key: 'db', label: 'DB', children: dbFields },
  { key: 'collection_id', label: 'Collection ID' },
  { key: 'name', label: 'Name' },
  { key: 'transform_target', label: 'Transform Target', format: 'boolean' },
  { key: 'caveats', label: 'Caveats' },
  { key: 'owner_email', label: 'Owner Email' },
  { key: 'transform_id', label: 'Transform ID' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'owner_user_id', label: 'Owner User ID' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'db_id', label: 'DB ID', format: 'number' },
  { key: 'archived_at', label: 'Archived At' },
  { key: 'data_source', label: 'Data Source' },
  { key: 'visibility_type', label: 'Visibility Type' },
  { key: 'deactivated_at', label: 'Deactivated At' },
  { key: 'data_authority', label: 'Data Authority' },
  { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'data_layer', label: 'Data Layer' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'estimated_row_count', label: 'Estimated Row Count' },
  { key: 'points_of_interest', label: 'Points Of Interest' },
];

export const embedQuestionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'embeddingParams', label: 'Embedding Params', dynamicKey: true },
  ],
};

export const getDashboardQuestionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'dashboard_name', label: 'Dashboard Name' },
    {
      key: 'available_parameters',
      label: 'Available Parameters',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'type', label: 'Type' },
        { key: 'possible_values', label: 'Possible Values' },
      ],
    },
    {
      key: 'cards_results',
      label: 'Cards Results',
      dynamicKey: true,
      children: [
        { key: 'name', label: 'Name' },
        {
          key: 'data',
          label: 'Data',
          listItems: [
            { key: 'ID', label: 'ID', format: 'number' },
            { key: 'Title', label: 'Title' },
            { key: 'Category', label: 'Category' },
          ],
        },
      ],
    },
  ],
};

export const getQuestionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'rows', label: 'Rows' },
        { key: 'cols', label: 'Cols', labelKey: 'name', listItems: colsFields },
        { key: 'native_form', label: 'Native Form' },
        { key: 'results_timezone', label: 'Results Timezone' },
        {
          key: 'results_metadata',
          label: 'Results Metadata',
          children: [{ key: 'columns', label: 'Columns' }],
        },
        { key: 'insights', label: 'Insights' },
      ],
    },
    { key: 'cached', label: 'Cached' },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    {
      key: 'json_query',
      label: 'JSON Query',
      children: [
        {
          key: 'constraints',
          label: 'Constraints',
          children: [
            { key: 'max-results', label: 'Max Results', format: 'number' },
            {
              key: 'max-results-bare-rows',
              label: 'Max Results Bare Rows',
              format: 'number',
            },
          ],
        },
        { key: 'lib/type', label: 'Lib Type' },
        {
          key: 'stages',
          label: 'Stages',
          listItems: [
            { key: 'template-tags', label: 'Template Tags' },
            { key: 'lib/type', label: 'Lib Type' },
            { key: 'native', label: 'Native' },
          ],
        },
        { key: 'middleware', label: 'Middleware' },
        { key: 'cache-strategy', label: 'Cache Strategy' },
        { key: 'database', label: 'Database', format: 'number' },
        {
          key: 'parameters',
          label: 'Parameters',
          labelKey: 'id',
          listItems: [
            { key: 'id', label: 'ID' },
            { key: 'type', label: 'Type' },
            { key: 'value', label: 'Value' },
            { key: 'target', label: 'Target' },
          ],
        },
      ],
    },
    { key: 'average_execution_time', label: 'Average Execution Time' },
    { key: 'status', label: 'Status' },
    { key: 'context', label: 'Context' },
    { key: 'tenant_id', label: 'Tenant ID' },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'running_time', label: 'Running Time', format: 'number' },
  ],
};

export const metabaseAddGroupMemberOutputSchema: OutputSchema = {
  itemLabel: '{email}',
  fields: [
    {
      key: 'items',
      label: 'Items',
      value: '',
      listItems: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'first_name', label: 'First Name' },
        { key: 'type', label: 'Type' },
        { key: 'membership_id', label: 'Membership ID', format: 'number' },
        { key: 'group_id', label: 'Group ID', format: 'number' },
        { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'common_name', label: 'Common Name' },
      ],
    },
  ],
};

export const metabaseConvertQueryToNativeOutputSchema: OutputSchema = {
  fields: [
    { key: 'query', label: 'Query' },
    { key: 'params', label: 'Params' },
  ],
};

export const metabaseCopyCardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'table_id', label: 'Table ID' },
    { key: 'creator', label: 'Creator', children: creatorFields },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'query_type', label: 'Query Type' },
    { key: 'name', label: 'Name' },
    { key: 'document_id', label: 'Document ID' },
    { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'type', label: 'Type' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'dataset_query', label: 'Dataset Query' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'parameter_mappings', label: 'Parameter Mappings' },
    { key: 'display', label: 'Display' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields3 },
    { key: 'parameters', label: 'Parameters' },
    { key: 'dashboard_id', label: 'Dashboard ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
  ],
};

export const metabaseCopyDashboardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
    { key: 'position', label: 'Position' },
    { key: 'entity_id', label: 'Entity ID' },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: parametersFields,
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseCreateActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'model_id', label: 'Model ID', format: 'number' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'kind', label: 'Kind' },
    { key: 'parameter_mappings', label: 'Parameter Mappings' },
    { key: 'entity_id', label: 'Entity ID' },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'display-name', label: 'Display Name' },
        { key: 'target', label: 'Target' },
        { key: 'type', label: 'Type' },
        { key: 'required', label: 'Required', format: 'boolean' },
        {
          key: 'is-auto-increment',
          label: 'Is Auto Increment',
          format: 'boolean',
        },
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
      ],
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
    { key: 'dataset_query', label: 'Dataset Query' },
  ],
};

export const metabaseCreateAlertOutputSchema: OutputSchema = {
  fields: [
    { key: 'payload_id', label: 'Payload ID', format: 'number' },
    {
      key: 'payload',
      label: 'Payload',
      children: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'card_id', label: 'Card ID', format: 'number' },
        { key: 'send_once', label: 'Send Once', format: 'boolean' },
        { key: 'send_condition', label: 'Send Condition' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
        { key: 'card', label: 'Card', children: metricsFields },
      ],
    },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'payload_type', label: 'Payload Type' },
    {
      key: 'handlers',
      label: 'Handlers',
      labelKey: 'id',
      listItems: [
        { key: 'template_id', label: 'Template ID' },
        { key: 'channel_type', label: 'Channel Type' },
        { key: 'channel', label: 'Channel' },
        { key: 'template', label: 'Template' },
        {
          key: 'recipients',
          label: 'Recipients',
          labelKey: 'id',
          listItems: [
            { key: 'type', label: 'Type' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'permissions_group_id', label: 'Permissions Group ID' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'user_id', label: 'User ID', format: 'number' },
            {
              key: 'notification_handler_id',
              label: 'Notification Handler ID',
              format: 'number',
            },
            { key: 'user', label: 'User' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
          ],
        },
        { key: 'channel_id', label: 'Channel ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'notification_id', label: 'Notification ID', format: 'number' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      labelKey: 'id',
      listItems: subscriptionsFields,
    },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseCreateBookmarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'document_id', label: 'Document ID', format: 'number' },
    { key: 'card_id', label: 'Card ID', format: 'number' },
    { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
  ],
};

export const metabaseCreateCardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
    { key: 'creator', label: 'Creator', children: creatorFields },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'query_type', label: 'Query Type' },
    { key: 'name', label: 'Name' },
    { key: 'document_id', label: 'Document ID' },
    { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
    { key: 'dashboard', label: 'Dashboard', children: dashboardFields },
    { key: 'type', label: 'Type' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'dataset_query', label: 'Dataset Query' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'parameter_mappings', label: 'Parameter Mappings' },
    { key: 'display', label: 'Display' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields3 },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: parametersFields2,
    },
    { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
    { key: 'persisted', label: 'Persisted', format: 'boolean' },
  ],
};

export const metabaseCreateCardPublicLinkOutputSchema: OutputSchema = {
  fields: [{ key: 'uuid', label: 'UUID' }],
};

export const metabaseCreateCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'slug', label: 'Slug' },
    { key: 'name', label: 'Name' },
    { key: 'personal_owner_id', label: 'Personal Owner ID' },
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'location', label: 'Location' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseCreateDashboardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'dashcards', label: 'Dashcards' },
    {
      key: 'can_set_cache_policy',
      label: 'Can Set Cache Policy',
      format: 'boolean',
    },
    { key: 'tabs', label: 'Tabs' },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'collection_authority_level', label: 'Collection Authority Level' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'last_used_param_values', label: 'Last Used Param Values' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
    { key: 'position', label: 'Position' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: parametersFields,
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseCreateDashboardSubscriptionOutputSchema: OutputSchema = {
  fields: [
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    {
      key: 'channels',
      label: 'Channels',
      labelKey: 'id',
      listItems: [
        { key: 'schedule_type', label: 'Schedule Type' },
        { key: 'schedule_hour', label: 'Schedule Hour', format: 'number' },
        { key: 'channel_type', label: 'Channel Type' },
        { key: 'schedule_frame', label: 'Schedule Frame' },
        {
          key: 'recipients',
          label: 'Recipients',
          labelKey: 'email',
          listItems: [
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'common_name', label: 'Common Name' },
            { key: 'id', label: 'ID', format: 'number' },
          ],
        },
        { key: 'channel_id', label: 'Channel ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'pulse_id', label: 'Pulse ID', format: 'number' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'schedule_day', label: 'Schedule Day' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'cards', label: 'Cards', labelKey: 'name', listItems: cardsFields },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'skip_if_empty', label: 'Skip If Empty', format: 'boolean' },
    { key: 'parameters', label: 'Parameters' },
    { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
    { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseCreateDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'content_type', label: 'Content Type' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    {
      key: 'document',
      label: 'Document',
      children: [
        { key: 'type', label: 'Type' },
        { key: 'content', label: 'Content' },
      ],
    },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'is_placeholder', label: 'Is Placeholder', format: 'boolean' },
    { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'exploration_id', label: 'Exploration ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
  ],
};

export const metabaseCreateGlossaryEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'term', label: 'Term' },
    { key: 'definition', label: 'Definition' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
  ],
};

export const metabaseCreateGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'magic_group_type', label: 'Magic Group Type' },
  ],
};

export const metabaseCreateSnippetOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'content', label: 'Content' },
    { key: 'collection_id', label: 'Collection ID' },
    { key: 'name', label: 'Name' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'template_tags', label: 'Template Tags' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseCreateTimelineEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'time_matters', label: 'Time Matters', format: 'boolean' },
    { key: 'name', label: 'Name' },
    { key: 'timeline_id', label: 'Timeline ID', format: 'number' },
    { key: 'icon', label: 'Icon' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseCreateTimelineOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'default', label: 'Default', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'icon', label: 'Icon' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseCreateUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'is_data_analyst', label: 'Is Data Analyst', format: 'boolean' },
    { key: 'locale', label: 'Locale' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'is_active', label: 'Is Active', format: 'boolean' },
    {
      key: 'user_group_memberships',
      label: 'User Group Memberships',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'ID', format: 'number' }],
    },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'date_joined', label: 'Date Joined', format: 'datetime' },
    { key: 'common_name', label: 'Common Name' },
  ],
};

export const metabaseDeactivateUserOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const metabaseDeleteActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'actionId', label: 'Action ID', format: 'number' },
  ],
};

export const metabaseDeleteBookmarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'model', label: 'Model' },
    { key: 'itemId', label: 'Item ID', format: 'number' },
  ],
};

export const metabaseDeleteCardOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'cardId', label: 'Card ID', format: 'number' },
  ],
};

export const metabaseDeleteCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'collectionId', label: 'Collection ID', format: 'number' },
  ],
};

export const metabaseDeleteDashboardOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'dashboardId', label: 'Dashboard ID', format: 'number' },
  ],
};

export const metabaseDeleteDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'documentId', label: 'Document ID', format: 'number' },
  ],
};

export const metabaseDeleteGlossaryEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'glossaryId', label: 'Glossary ID', format: 'number' },
  ],
};

export const metabaseDeleteGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'groupId', label: 'Group ID', format: 'number' },
  ],
};

export const metabaseDeleteSegmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'segmentId', label: 'Segment ID', format: 'number' },
  ],
};

export const metabaseDeleteTimelineEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'eventId', label: 'Event ID', format: 'number' },
  ],
};

export const metabaseDeleteTimelineOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'timelineId', label: 'Timeline ID', format: 'number' },
  ],
};

export const metabaseExecuteActionOutputSchema: OutputSchema = {
  fields: [{ key: 'rows-affected', label: 'Rows Affected', format: 'number' }],
};

export const metabaseGetActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'dataset_query', label: 'Dataset Query' },
    { key: 'model_id', label: 'Model ID', format: 'number' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'parameter_mappings', label: 'Parameter Mappings' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'parameters', label: 'Parameters' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
  ],
};

export const metabaseGetAlertOutputSchema: OutputSchema = {
  fields: [
    { key: 'payload_id', label: 'Payload ID', format: 'number' },
    {
      key: 'payload',
      label: 'Payload',
      children: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'card_id', label: 'Card ID', format: 'number' },
        { key: 'send_once', label: 'Send Once', format: 'boolean' },
        { key: 'send_condition', label: 'Send Condition' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
        {
          key: 'card',
          label: 'Card',
          children: [
            { key: 'description', label: 'Description' },
            { key: 'archived', label: 'Archived', format: 'boolean' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'database_id', label: 'Database ID', format: 'number' },
            {
              key: 'enable_embedding',
              label: 'Enable Embedding',
              format: 'boolean',
            },
            { key: 'collection_id', label: 'Collection ID' },
            { key: 'query_type', label: 'Query Type' },
            { key: 'name', label: 'Name' },
            { key: 'document_id', label: 'Document ID' },
            { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
            { key: 'type', label: 'Type' },
            { key: 'creator_id', label: 'Creator ID', format: 'number' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'embedding_params', label: 'Embedding Params' },
            { key: 'cache_ttl', label: 'Cache TTL' },
            { key: 'dataset_query', label: 'Dataset Query' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'parameter_mappings', label: 'Parameter Mappings' },
            { key: 'display', label: 'Display' },
            { key: 'entity_id', label: 'Entity ID' },
            { key: 'parameters', label: 'Parameters' },
            { key: 'dashboard_id', label: 'Dashboard ID' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'public_uuid', label: 'Public UUID' },
          ],
        },
      ],
    },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'payload_type', label: 'Payload Type' },
    {
      key: 'handlers',
      label: 'Handlers',
      labelKey: 'id',
      listItems: [
        { key: 'template_id', label: 'Template ID' },
        { key: 'channel_type', label: 'Channel Type' },
        { key: 'channel', label: 'Channel' },
        { key: 'template', label: 'Template' },
        {
          key: 'recipients',
          label: 'Recipients',
          labelKey: 'id',
          listItems: [
            { key: 'id', label: 'ID', format: 'number' },
            {
              key: 'notification_handler_id',
              label: 'Notification Handler ID',
              format: 'number',
            },
            { key: 'type', label: 'Type' },
            { key: 'user_id', label: 'User ID' },
            { key: 'permissions_group_id', label: 'Permissions Group ID' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
          ],
        },
        { key: 'channel_id', label: 'Channel ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'notification_id', label: 'Notification ID', format: 'number' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      labelKey: 'id',
      listItems: subscriptionsFields,
    },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseGetCardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
    { key: 'creator', label: 'Creator', children: creatorFields },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'query_type', label: 'Query Type' },
    { key: 'name', label: 'Name' },
    { key: 'document_id', label: 'Document ID' },
    { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'type', label: 'Type' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params', dynamicKey: true },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'dataset_query', label: 'Dataset Query' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'parameter_mappings', label: 'Parameter Mappings' },
    { key: 'display', label: 'Display' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields2 },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: parametersFields3,
    },
    { key: 'dashboard_id', label: 'Dashboard ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
  ],
};

export const metabaseGetCardQueryMetadataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'databases',
      label: 'Databases',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'features', label: 'Features' },
        { key: 'timezone', label: 'Timezone' },
        {
          key: 'auto_run_queries',
          label: 'Auto Run Queries',
          format: 'boolean',
        },
        { key: 'is_stub', label: 'Is Stub', format: 'boolean' },
        { key: 'name', label: 'Name' },
        { key: 'caveats', label: 'Caveats' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'provider_name', label: 'Provider Name' },
        { key: 'native_permissions', label: 'Native Permissions' },
        { key: 'cache_ttl', label: 'Cache TTL' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'engine', label: 'Engine' },
        { key: 'refingerprint', label: 'Refingerprint' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
        { key: 'admin_details', label: 'Admin Details' },
      ],
    },
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'display_name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'schema', label: 'Schema' },
        { key: 'fields', label: 'Fields' },
        { key: 'type', label: 'Type' },
        { key: 'moderated_status', label: 'Moderated Status' },
        { key: 'id', label: 'ID' },
        { key: 'db_id', label: 'DB ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'metrics', label: 'Metrics' },
      ],
    },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'database_type', label: 'Database Type' },
        { key: 'semantic_type', label: 'Semantic Type' },
        { key: 'table_id', label: 'Table ID', format: 'number' },
        { key: 'coercion_strategy', label: 'Coercion Strategy' },
        { key: 'database_indexed', label: 'Database Indexed' },
        {
          key: 'dimension_interestingness',
          label: 'Dimension Interestingness',
        },
        { key: 'name', label: 'Name' },
        {
          key: 'fingerprint_version',
          label: 'Fingerprint Version',
          format: 'number',
        },
        { key: 'has_field_values', label: 'Has Field Values' },
        { key: 'database_is_pk', label: 'Database Is PK' },
        { key: 'caveats', label: 'Caveats' },
        { key: 'fk_target_field_id', label: 'FK Target Field ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'custom_position', label: 'Custom Position', format: 'number' },
        { key: 'database_default', label: 'Database Default' },
        { key: 'effective_type', label: 'Effective Type' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'parent_id', label: 'Parent ID' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_analyzed', label: 'Last Analyzed' },
        { key: 'database_partitioned', label: 'Database Partitioned' },
        {
          key: 'database_is_auto_increment',
          label: 'Database Is Auto Increment',
          format: 'boolean',
        },
        { key: 'json_unfolding', label: 'JSON Unfolding', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'visibility_type', label: 'Visibility Type' },
        { key: 'preview_display', label: 'Preview Display', format: 'boolean' },
        { key: 'database_is_generated', label: 'Database Is Generated' },
        { key: 'data_sensitivity', label: 'Data Sensitivity' },
        { key: 'display_name', label: 'Display Name' },
        {
          key: 'database_position',
          label: 'Database Position',
          format: 'number',
        },
        {
          key: 'database_required',
          label: 'Database Required',
          format: 'boolean',
        },
        { key: 'database_is_nullable', label: 'Database Is Nullable' },
        { key: 'name_field', label: 'Name Field' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'base_type', label: 'Base Type' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
      ],
    },
    { key: 'snippets', label: 'Snippets' },
  ],
};

export const metabaseGetCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'parent_id', label: 'Parent ID', format: 'number' },
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'slug', label: 'Slug' },
    { key: 'personal_owner_id', label: 'Personal Owner ID' },
    { key: 'type', label: 'Type' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'location', label: 'Location' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseGetCollectionTreeOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'collections',
      label: 'Collections',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        {
          key: 'children',
          label: 'Children',
          labelKey: 'name',
          listItems: [
            { key: 'description', label: 'Description' },
            { key: 'archived', label: 'Archived', format: 'boolean' },
            { key: 'children', label: 'Children' },
            { key: 'slug', label: 'Slug' },
            { key: 'name', label: 'Name' },
            { key: 'personal_owner_id', label: 'Personal Owner ID' },
            { key: 'type', label: 'Type' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'entity_id', label: 'Entity ID' },
            { key: 'location', label: 'Location' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
          ],
        },
        { key: 'slug', label: 'Slug' },
        { key: 'name', label: 'Name' },
        {
          key: 'personal_owner_id',
          label: 'Personal Owner ID',
          format: 'number',
        },
        { key: 'type', label: 'Type' },
        { key: 'here', label: 'Here' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'location', label: 'Location' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseGetCurrentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'has_model', label: 'Has Model', format: 'boolean' },
    { key: 'is_data_analyst', label: 'Is Data Analyst', format: 'boolean' },
    { key: 'locale', label: 'Locale' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'is_active', label: 'Is Active', format: 'boolean' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'group_ids', label: 'Group IDs' },
    { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'date_joined', label: 'Date Joined', format: 'datetime' },
    {
      key: 'can_write_any_collection',
      label: 'Can Write Any Collection',
      format: 'boolean',
    },
    { key: 'common_name', label: 'Common Name' },
    { key: 'attributes', label: 'Attributes' },
  ],
};

export const metabaseGetDashboardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    {
      key: 'dashcards',
      label: 'Dashcards',
      labelKey: 'id',
      listItems: [
        { key: 'size_x', label: 'Size X', format: 'number' },
        {
          key: 'collection_authority_level',
          label: 'Collection Authority Level',
        },
        {
          key: 'card',
          label: 'Card',
          children: [
            { key: 'description', label: 'Description' },
            { key: 'archived', label: 'Archived', format: 'boolean' },
            { key: 'table_id', label: 'Table ID' },
            { key: 'database_id', label: 'Database ID', format: 'number' },
            {
              key: 'enable_embedding',
              label: 'Enable Embedding',
              format: 'boolean',
            },
            { key: 'collection_id', label: 'Collection ID', format: 'number' },
            { key: 'query_type', label: 'Query Type' },
            { key: 'download_perms', label: 'Download Perms' },
            { key: 'name', label: 'Name' },
            { key: 'document_id', label: 'Document ID' },
            { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
            { key: 'type', label: 'Type' },
            { key: 'creator_id', label: 'Creator ID', format: 'number' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'embedding_params', label: 'Embedding Params' },
            { key: 'cache_ttl', label: 'Cache TTL' },
            { key: 'dataset_query', label: 'Dataset Query' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'parameter_mappings', label: 'Parameter Mappings' },
            { key: 'display', label: 'Display' },
            { key: 'entity_id', label: 'Entity ID' },
            { key: 'parameters', label: 'Parameters' },
            { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'public_uuid', label: 'Public UUID' },
          ],
        },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'col', label: 'Col', format: 'number' },
        { key: 'id', label: 'ID', format: 'number' },
        {
          key: 'parameter_mappings',
          label: 'Parameter Mappings',
          listItems: parameterMappingsFields,
        },
        { key: 'card_id', label: 'Card ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'size_y', label: 'Size Y', format: 'number' },
        { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'row', label: 'Row', format: 'number' },
      ],
    },
    {
      key: 'can_set_cache_policy',
      label: 'Can Set Cache Policy',
      format: 'boolean',
    },
    { key: 'tabs', label: 'Tabs' },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'collection_authority_level', label: 'Collection Authority Level' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    {
      key: 'last_used_param_values',
      label: 'Last Used Param Values',
      dynamicKey: true,
    },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
    { key: 'position', label: 'Position' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields3 },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: parametersFields,
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseGetDashboardSubscriptionOutputSchema: OutputSchema = {
  fields: [
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    {
      key: 'channels',
      label: 'Channels',
      labelKey: 'id',
      listItems: channelsFields,
    },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'cards', label: 'Cards', labelKey: 'name', listItems: cardsFields },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'skip_if_empty', label: 'Skip If Empty', format: 'boolean' },
    { key: 'parameters', label: 'Parameters' },
    { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
    { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseGetDatabaseMetadataOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'features', label: 'Features' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'auto_run_queries', label: 'Auto Run Queries', format: 'boolean' },
    { key: 'is_stub', label: 'Is Stub', format: 'boolean' },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'schema', label: 'Schema' },
        { key: 'is_writable', label: 'Is Writable' },
        { key: 'database_require_filter', label: 'Database Require Filter' },
        { key: 'collection_id', label: 'Collection ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'transform_target',
          label: 'Transform Target',
          format: 'boolean',
        },
        {
          key: 'fields',
          label: 'Fields',
          labelKey: 'name',
          listItems: fieldsFields,
        },
        { key: 'caveats', label: 'Caveats' },
        { key: 'owner_email', label: 'Owner Email' },
        { key: 'transform_id', label: 'Transform ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'is_published', label: 'Is Published', format: 'boolean' },
        { key: 'owner_user_id', label: 'Owner User ID' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'db_id', label: 'DB ID', format: 'number' },
        { key: 'archived_at', label: 'Archived At' },
        { key: 'data_source', label: 'Data Source' },
        { key: 'visibility_type', label: 'Visibility Type' },
        { key: 'deactivated_at', label: 'Deactivated At' },
        { key: 'data_authority', label: 'Data Authority' },
        { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'data_layer', label: 'Data Layer' },
        {
          key: 'metrics',
          label: 'Metrics',
          labelKey: 'name',
          listItems: metricsFields,
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'estimated_row_count', label: 'Estimated Row Count' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
      ],
    },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'provider_name', label: 'Provider Name' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'engine', label: 'Engine' },
    { key: 'refingerprint', label: 'Refingerprint' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
    { key: 'admin_details', label: 'Admin Details' },
  ],
};

export const metabaseGetDatabaseOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'features', label: 'Features' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'auto_run_queries', label: 'Auto Run Queries', format: 'boolean' },
    { key: 'is_stub', label: 'Is Stub', format: 'boolean' },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'schema', label: 'Schema' },
        { key: 'is_writable', label: 'Is Writable' },
        { key: 'database_require_filter', label: 'Database Require Filter' },
        { key: 'collection_id', label: 'Collection ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'transform_target',
          label: 'Transform Target',
          format: 'boolean',
        },
        { key: 'caveats', label: 'Caveats' },
        { key: 'owner_email', label: 'Owner Email' },
        { key: 'transform_id', label: 'Transform ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'is_published', label: 'Is Published', format: 'boolean' },
        { key: 'owner_user_id', label: 'Owner User ID' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'db_id', label: 'DB ID', format: 'number' },
        { key: 'archived_at', label: 'Archived At' },
        { key: 'data_source', label: 'Data Source' },
        { key: 'visibility_type', label: 'Visibility Type' },
        { key: 'deactivated_at', label: 'Deactivated At' },
        { key: 'data_authority', label: 'Data Authority' },
        { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'data_layer', label: 'Data Layer' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'estimated_row_count', label: 'Estimated Row Count' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
        {
          key: 'fields',
          label: 'Fields',
          labelKey: 'name',
          listItems: fieldsFields,
        },
      ],
    },
    { key: 'can-manage', label: 'Can Manage', format: 'boolean' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'provider_name', label: 'Provider Name' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'id', label: 'ID', format: 'number' },
    {
      key: 'schedules',
      label: 'Schedules',
      children: [
        {
          key: 'metadata_sync',
          label: 'Metadata Sync',
          children: metadataSyncFields,
        },
        {
          key: 'cache_field_values',
          label: 'Cache Field Values',
          children: cacheFieldValuesFields,
        },
      ],
    },
    { key: 'engine', label: 'Engine' },
    { key: 'refingerprint', label: 'Refingerprint' },
    { key: 'router_user_attribute', label: 'Router User Attribute' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
    { key: 'admin_details', label: 'Admin Details' },
  ],
};

export const metabaseGetFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'database_type', label: 'Database Type' },
    { key: 'semantic_type', label: 'Semantic Type' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
    { key: 'coercion_strategy', label: 'Coercion Strategy' },
    { key: 'table', label: 'Table', children: tablesFields },
    { key: 'database_indexed', label: 'Database Indexed' },
    { key: 'dimension_interestingness', label: 'Dimension Interestingness' },
    { key: 'name', label: 'Name' },
    {
      key: 'fingerprint_version',
      label: 'Fingerprint Version',
      format: 'number',
    },
    { key: 'has_field_values', label: 'Has Field Values' },
    { key: 'database_is_pk', label: 'Database Is PK' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'fk_target_field_id', label: 'FK Target Field ID' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'custom_position', label: 'Custom Position', format: 'number' },
    { key: 'database_default', label: 'Database Default' },
    { key: 'effective_type', label: 'Effective Type' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'parent_id', label: 'Parent ID' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_analyzed', label: 'Last Analyzed' },
    { key: 'database_partitioned', label: 'Database Partitioned' },
    {
      key: 'database_is_auto_increment',
      label: 'Database Is Auto Increment',
      format: 'boolean',
    },
    { key: 'json_unfolding', label: 'JSON Unfolding', format: 'boolean' },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'visibility_type', label: 'Visibility Type' },
    { key: 'target', label: 'Target' },
    { key: 'preview_display', label: 'Preview Display', format: 'boolean' },
    { key: 'database_is_generated', label: 'Database Is Generated' },
    { key: 'data_sensitivity', label: 'Data Sensitivity' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'database_position', label: 'Database Position', format: 'number' },
    { key: 'database_required', label: 'Database Required', format: 'boolean' },
    { key: 'database_is_nullable', label: 'Database Is Nullable' },
    { key: 'name_field', label: 'Name Field' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'base_type', label: 'Base Type' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseGetFieldSummaryOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Items', value: '' }],
};

export const metabaseGetGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'magic_group_type', label: 'Magic Group Type' },
    { key: 'members', label: 'Members' },
  ],
};

export const metabaseGetSegmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
    { key: 'definition', label: 'Definition' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseGetTableDataOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Data', children: dataFields },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    { key: 'status', label: 'Status' },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'running_time', label: 'Running Time', format: 'number' },
  ],
};

export const metabaseGetTableMetadataOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'entity_type', label: 'Entity Type' },
    { key: 'schema', label: 'Schema' },
    { key: 'is_writable', label: 'Is Writable' },
    { key: 'database_require_filter', label: 'Database Require Filter' },
    { key: 'db', label: 'DB', children: dbFields },
    { key: 'collection_id', label: 'Collection ID' },
    { key: 'name', label: 'Name' },
    { key: 'transform_target', label: 'Transform Target', format: 'boolean' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'database_type', label: 'Database Type' },
        { key: 'semantic_type', label: 'Semantic Type' },
        { key: 'table_id', label: 'Table ID', format: 'number' },
        { key: 'coercion_strategy', label: 'Coercion Strategy' },
        { key: 'database_indexed', label: 'Database Indexed' },
        {
          key: 'dimension_interestingness',
          label: 'Dimension Interestingness',
          format: 'number',
        },
        { key: 'name', label: 'Name' },
        {
          key: 'fingerprint_version',
          label: 'Fingerprint Version',
          format: 'number',
        },
        { key: 'has_field_values', label: 'Has Field Values' },
        { key: 'database_is_pk', label: 'Database Is PK' },
        { key: 'caveats', label: 'Caveats' },
        {
          key: 'fk_target_field_id',
          label: 'FK Target Field ID',
          format: 'number',
        },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'custom_position', label: 'Custom Position', format: 'number' },
        { key: 'database_default', label: 'Database Default' },
        { key: 'effective_type', label: 'Effective Type' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'parent_id', label: 'Parent ID' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_analyzed', label: 'Last Analyzed' },
        { key: 'database_partitioned', label: 'Database Partitioned' },
        {
          key: 'database_is_auto_increment',
          label: 'Database Is Auto Increment',
          format: 'boolean',
        },
        { key: 'json_unfolding', label: 'JSON Unfolding', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'visibility_type', label: 'Visibility Type' },
        {
          key: 'target',
          label: 'Target',
          children: [
            { key: 'description', label: 'Description' },
            { key: 'database_type', label: 'Database Type' },
            { key: 'semantic_type', label: 'Semantic Type' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'coercion_strategy', label: 'Coercion Strategy' },
            { key: 'database_indexed', label: 'Database Indexed' },
            {
              key: 'dimension_interestingness',
              label: 'Dimension Interestingness',
              format: 'number',
            },
            { key: 'name', label: 'Name' },
            {
              key: 'fingerprint_version',
              label: 'Fingerprint Version',
              format: 'number',
            },
            { key: 'has_field_values', label: 'Has Field Values' },
            { key: 'database_is_pk', label: 'Database Is PK' },
            { key: 'caveats', label: 'Caveats' },
            { key: 'fk_target_field_id', label: 'FK Target Field ID' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            {
              key: 'custom_position',
              label: 'Custom Position',
              format: 'number',
            },
            { key: 'database_default', label: 'Database Default' },
            { key: 'effective_type', label: 'Effective Type' },
            { key: 'active', label: 'Active', format: 'boolean' },
            { key: 'parent_id', label: 'Parent ID' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'last_analyzed', label: 'Last Analyzed' },
            { key: 'database_partitioned', label: 'Database Partitioned' },
            {
              key: 'database_is_auto_increment',
              label: 'Database Is Auto Increment',
              format: 'boolean',
            },
            {
              key: 'json_unfolding',
              label: 'JSON Unfolding',
              format: 'boolean',
            },
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'visibility_type', label: 'Visibility Type' },
            {
              key: 'preview_display',
              label: 'Preview Display',
              format: 'boolean',
            },
            { key: 'database_is_generated', label: 'Database Is Generated' },
            { key: 'data_sensitivity', label: 'Data Sensitivity' },
            { key: 'display_name', label: 'Display Name' },
            {
              key: 'database_position',
              label: 'Database Position',
              format: 'number',
            },
            {
              key: 'database_required',
              label: 'Database Required',
              format: 'boolean',
            },
            { key: 'database_is_nullable', label: 'Database Is Nullable' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'base_type', label: 'Base Type' },
            { key: 'points_of_interest', label: 'Points Of Interest' },
          ],
        },
        { key: 'preview_display', label: 'Preview Display', format: 'boolean' },
        { key: 'database_is_generated', label: 'Database Is Generated' },
        { key: 'data_sensitivity', label: 'Data Sensitivity' },
        { key: 'display_name', label: 'Display Name' },
        {
          key: 'database_position',
          label: 'Database Position',
          format: 'number',
        },
        {
          key: 'database_required',
          label: 'Database Required',
          format: 'boolean',
        },
        { key: 'database_is_nullable', label: 'Database Is Nullable' },
        { key: 'name_field', label: 'Name Field' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'base_type', label: 'Base Type' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
      ],
    },
    { key: 'caveats', label: 'Caveats' },
    { key: 'owner_email', label: 'Owner Email' },
    { key: 'transform_id', label: 'Transform ID' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'is_published', label: 'Is Published', format: 'boolean' },
    { key: 'owner_user_id', label: 'Owner User ID' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'db_id', label: 'DB ID', format: 'number' },
    { key: 'archived_at', label: 'Archived At' },
    { key: 'data_source', label: 'Data Source' },
    { key: 'visibility_type', label: 'Visibility Type' },
    { key: 'deactivated_at', label: 'Deactivated At' },
    { key: 'data_authority', label: 'Data Authority' },
    { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'data_layer', label: 'Data Layer' },
    { key: 'collection', label: 'Collection' },
    {
      key: 'metrics',
      label: 'Metrics',
      labelKey: 'name',
      listItems: metricsFields,
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'estimated_row_count', label: 'Estimated Row Count' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseGetTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'entity_type', label: 'Entity Type' },
    { key: 'schema', label: 'Schema' },
    { key: 'is_writable', label: 'Is Writable' },
    { key: 'database_require_filter', label: 'Database Require Filter' },
    { key: 'db', label: 'DB', children: dbFields },
    { key: 'collection_id', label: 'Collection ID' },
    { key: 'name', label: 'Name' },
    { key: 'transform_target', label: 'Transform Target', format: 'boolean' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'owner_email', label: 'Owner Email' },
    { key: 'transform_id', label: 'Transform ID' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'pk_field', label: 'PK Field', format: 'number' },
    { key: 'is_published', label: 'Is Published', format: 'boolean' },
    { key: 'owner_user_id', label: 'Owner User ID' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'db_id', label: 'DB ID', format: 'number' },
    { key: 'archived_at', label: 'Archived At' },
    { key: 'data_source', label: 'Data Source' },
    { key: 'visibility_type', label: 'Visibility Type' },
    { key: 'deactivated_at', label: 'Deactivated At' },
    { key: 'data_authority', label: 'Data Authority' },
    { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'data_layer', label: 'Data Layer' },
    { key: 'collection', label: 'Collection' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'estimated_row_count', label: 'Estimated Row Count' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseGetTimelineOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'default', label: 'Default', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    {
      key: 'events',
      label: 'Events',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'timezone', label: 'Timezone' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'time_matters', label: 'Time Matters', format: 'boolean' },
        { key: 'name', label: 'Name' },
        { key: 'timeline_id', label: 'Timeline ID', format: 'number' },
        { key: 'icon', label: 'Icon' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'icon', label: 'Icon' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields3 },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseGetUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'is_data_analyst', label: 'Is Data Analyst', format: 'boolean' },
    { key: 'locale', label: 'Locale' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'is_active', label: 'Is Active', format: 'boolean' },
    {
      key: 'user_group_memberships',
      label: 'User Group Memberships',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'ID', format: 'number' }],
    },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'date_joined', label: 'Date Joined', format: 'datetime' },
    { key: 'common_name', label: 'Common Name' },
  ],
};

export const metabaseListActionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'actions',
      label: 'Actions',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'database_id', label: 'Database ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'dataset_query', label: 'Dataset Query' },
        { key: 'model_id', label: 'Model ID', format: 'number' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'parameter_mappings', label: 'Parameter Mappings' },
        { key: 'entity_id', label: 'Entity ID' },
        {
          key: 'parameters',
          label: 'Parameters',
          labelKey: 'id',
          listItems: [
            { key: 'id', label: 'ID' },
            { key: 'display-name', label: 'Display Name' },
            { key: 'target', label: 'Target' },
            { key: 'type', label: 'Type' },
            { key: 'required', label: 'Required', format: 'boolean' },
            {
              key: 'is-auto-increment',
              label: 'Is Auto Increment',
              format: 'boolean',
            },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'public_uuid', label: 'Public UUID' },
        { key: 'kind', label: 'Kind' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListAlertsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'alerts',
      label: 'Alerts',
      labelKey: 'id',
      listItems: [
        { key: 'payload_id', label: 'Payload ID', format: 'number' },
        {
          key: 'payload',
          label: 'Payload',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'card_id', label: 'Card ID', format: 'number' },
            { key: 'send_once', label: 'Send Once', format: 'boolean' },
            { key: 'send_condition', label: 'Send Condition' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
            { key: 'card', label: 'Card' },
          ],
        },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'payload_type', label: 'Payload Type' },
        {
          key: 'handlers',
          label: 'Handlers',
          labelKey: 'id',
          listItems: [
            { key: 'template_id', label: 'Template ID' },
            { key: 'channel_type', label: 'Channel Type' },
            { key: 'channel', label: 'Channel' },
            { key: 'template', label: 'Template' },
            { key: 'recipients', label: 'Recipients' },
            { key: 'channel_id', label: 'Channel ID' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            {
              key: 'notification_id',
              label: 'Notification ID',
              format: 'number',
            },
            { key: 'active', label: 'Active', format: 'boolean' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
          ],
        },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        {
          key: 'subscriptions',
          label: 'Subscriptions',
          labelKey: 'id',
          listItems: subscriptionsFields,
        },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListBookmarksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'bookmarks',
      label: 'Bookmarks',
      labelKey: 'name',
      listItems: [
        { key: 'item_id', label: 'Item ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'ID' },
        { key: 'description', label: 'Description' },
        { key: 'card_type', label: 'Card Type' },
        { key: 'display', label: 'Display' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListCardDashboardsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'dashboards',
      label: 'Dashboards',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'ID', format: 'number' },
        {
          key: 'enable_embedding',
          label: 'Enable Embedding',
          format: 'boolean',
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListCardsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'cards',
      label: 'Cards',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'table_id', label: 'Table ID', format: 'number' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'database_id', label: 'Database ID', format: 'number' },
        {
          key: 'enable_embedding',
          label: 'Enable Embedding',
          format: 'boolean',
        },
        { key: 'collection_id', label: 'Collection ID', format: 'number' },
        { key: 'query_type', label: 'Query Type' },
        { key: 'name', label: 'Name' },
        { key: 'document_id', label: 'Document ID' },
        { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
        { key: 'type', label: 'Type' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'embedding_params', label: 'Embedding Params' },
        { key: 'cache_ttl', label: 'Cache TTL' },
        { key: 'dataset_query', label: 'Dataset Query' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'parameter_mappings', label: 'Parameter Mappings' },
        { key: 'display', label: 'Display' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'collection', label: 'Collection', children: collectionFields3 },
        { key: 'parameters', label: 'Parameters' },
        { key: 'dashboard_id', label: 'Dashboard ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'public_uuid', label: 'Public UUID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListCollectionItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total', label: 'Total', format: 'number' },
    {
      key: 'data',
      label: 'Data',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        {
          key: 'is_shared_tenant_collection',
          label: 'Is Shared Tenant Collection',
          format: 'boolean',
        },
        { key: 'database_id', label: 'Database ID', format: 'number' },
        { key: 'collection_id', label: 'Collection ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
        { key: 'type', label: 'Type' },
        { key: 'here', label: 'Here' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'location', label: 'Location' },
        { key: 'dashboard_id', label: 'Dashboard ID' },
        { key: 'model', label: 'Model' },
        { key: 'below', label: 'Below' },
        {
          key: 'is_tenant_dashboard',
          label: 'Is Tenant Dashboard',
          format: 'boolean',
        },
        { key: 'moderated_status', label: 'Moderated Status' },
        { key: 'collection_namespace', label: 'Collection Namespace' },
        {
          key: 'fully_parameterized',
          label: 'Fully Parameterized',
          format: 'boolean',
        },
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'display', label: 'Display' },
        { key: 'table_id', label: 'Table ID' },
        { key: 'query_type', label: 'Query Type' },
        { key: 'personal_owner_id', label: 'Personal Owner ID' },
        { key: 'icon', label: 'Icon' },
        { key: 'dataset_query', label: 'Dataset Query' },
        { key: 'is_upload', label: 'Is Upload' },
      ],
    },
    { key: 'models', label: 'Models' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
  ],
};

export const metabaseListCollectionTimelinesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'timelines',
      label: 'Timelines',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'collection_id', label: 'Collection ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'icon', label: 'Icon' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'collection', label: 'Collection', children: collectionFields },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        {
          key: 'events',
          label: 'Events',
          labelKey: 'name',
          listItems: eventsFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListCollectionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'collections',
      label: 'Collections',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'parent_id', label: 'Parent ID', format: 'number' },
        { key: 'id', label: 'ID' },
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'slug', label: 'Slug' },
        {
          key: 'personal_owner_id',
          label: 'Personal Owner ID',
          format: 'number',
        },
        { key: 'type', label: 'Type' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'location', label: 'Location' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListDashboardSubscriptionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      labelKey: 'name',
      listItems: [
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        {
          key: 'channels',
          label: 'Channels',
          labelKey: 'id',
          listItems: [
            { key: 'schedule_type', label: 'Schedule Type' },
            { key: 'schedule_hour', label: 'Schedule Hour', format: 'number' },
            { key: 'channel_type', label: 'Channel Type' },
            { key: 'schedule_frame', label: 'Schedule Frame' },
            { key: 'recipients', label: 'Recipients' },
            { key: 'channel_id', label: 'Channel ID' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'pulse_id', label: 'Pulse ID', format: 'number' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'schedule_day', label: 'Schedule Day' },
            { key: 'entity_id', label: 'Entity ID' },
            { key: 'enabled', label: 'Enabled', format: 'boolean' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
          ],
        },
        { key: 'collection_id', label: 'Collection ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'id', label: 'ID', format: 'number' },
        {
          key: 'cards',
          label: 'Cards',
          labelKey: 'name',
          listItems: [
            { key: 'description', label: 'Description' },
            { key: 'format_rows', label: 'Format Rows', format: 'boolean' },
            { key: 'include_xls', label: 'Include XLS', format: 'boolean' },
            {
              key: 'dashboard_card_id',
              label: 'Dashboard Card ID',
              format: 'number',
            },
            { key: 'collection_id', label: 'Collection ID', format: 'number' },
            { key: 'download_perms', label: 'Download Perms' },
            { key: 'name', label: 'Name' },
            { key: 'pivot_results', label: 'Pivot Results', format: 'boolean' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'parameter_mappings', label: 'Parameter Mappings' },
            { key: 'include_csv', label: 'Include CSV', format: 'boolean' },
            { key: 'display', label: 'Display' },
            { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
          ],
        },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'skip_if_empty', label: 'Skip If Empty', format: 'boolean' },
        { key: 'parameters', label: 'Parameters' },
        { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
        { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListDashboardsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'dashboards',
      label: 'Dashboards',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        {
          key: 'enable_embedding',
          label: 'Enable Embedding',
          format: 'boolean',
        },
        { key: 'collection_id', label: 'Collection ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'caveats', label: 'Caveats' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'embedding_params', label: 'Embedding Params' },
        { key: 'cache_ttl', label: 'Cache TTL' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
        { key: 'position', label: 'Position' },
        { key: 'entity_id', label: 'Entity ID' },
        {
          key: 'parameters',
          label: 'Parameters',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'required', label: 'Required', format: 'boolean' },
            { key: 'sectionId', label: 'Section ID' },
            { key: 'slug', label: 'Slug' },
            { key: 'type', label: 'Type' },
            { key: 'default', label: 'Default' },
            {
              key: 'isMultiSelect',
              label: 'Is Multi Select',
              format: 'boolean',
            },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'public_uuid', label: 'Public UUID' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListDatabaseFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'base_type', label: 'Base Type' },
        { key: 'semantic_type', label: 'Semantic Type' },
        { key: 'table_name', label: 'Table Name' },
        { key: 'table_id', label: 'Table ID', format: 'number' },
        { key: 'schema', label: 'Schema' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListDatabaseSchemasOutputSchema: OutputSchema = {
  fields: [
    { key: 'schemas', label: 'Schemas' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListDatabasesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'features', label: 'Features' },
        { key: 'timezone', label: 'Timezone' },
        {
          key: 'auto_run_queries',
          label: 'Auto Run Queries',
          format: 'boolean',
        },
        { key: 'is_stub', label: 'Is Stub', format: 'boolean' },
        { key: 'transforms_permissions', label: 'Transforms Permissions' },
        { key: 'name', label: 'Name' },
        { key: 'caveats', label: 'Caveats' },
        {
          key: 'tables',
          label: 'Tables',
          labelKey: 'name',
          listItems: [
            { key: 'description', label: 'Description' },
            { key: 'entity_type', label: 'Entity Type' },
            { key: 'schema', label: 'Schema' },
            { key: 'is_writable', label: 'Is Writable' },
            {
              key: 'database_require_filter',
              label: 'Database Require Filter',
            },
            { key: 'collection_id', label: 'Collection ID' },
            { key: 'name', label: 'Name' },
            {
              key: 'transform_target',
              label: 'Transform Target',
              format: 'boolean',
            },
            { key: 'caveats', label: 'Caveats' },
            { key: 'owner_email', label: 'Owner Email' },
            { key: 'transform_id', label: 'Transform ID' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'is_published', label: 'Is Published', format: 'boolean' },
            { key: 'owner_user_id', label: 'Owner User ID' },
            { key: 'active', label: 'Active', format: 'boolean' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'db_id', label: 'DB ID', format: 'number' },
            { key: 'archived_at', label: 'Archived At' },
            { key: 'data_source', label: 'Data Source' },
            { key: 'visibility_type', label: 'Visibility Type' },
            { key: 'deactivated_at', label: 'Deactivated At' },
            { key: 'data_authority', label: 'Data Authority' },
            { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
            { key: 'display_name', label: 'Display Name' },
            { key: 'data_layer', label: 'Data Layer' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'estimated_row_count', label: 'Estimated Row Count' },
            { key: 'points_of_interest', label: 'Points Of Interest' },
          ],
        },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'provider_name', label: 'Provider Name' },
        { key: 'native_permissions', label: 'Native Permissions' },
        { key: 'cache_ttl', label: 'Cache TTL' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'engine', label: 'Engine' },
        { key: 'refingerprint', label: 'Refingerprint' },
        { key: 'router_user_attribute', label: 'Router User Attribute' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
        { key: 'admin_details', label: 'Admin Details' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const metabaseListDocumentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'collection_id', label: 'Collection ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'content_type', label: 'Content Type' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        {
          key: 'document',
          label: 'Document',
          children: [
            { key: 'type', label: 'Type' },
            { key: 'content', label: 'Content' },
          ],
        },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'is_placeholder', label: 'Is Placeholder', format: 'boolean' },
        { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'exploration_id', label: 'Exploration ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'public_uuid', label: 'Public UUID' },
      ],
    },
  ],
};

export const metabaseListFieldValuesOutputSchema: OutputSchema = {
  fields: [
    { key: 'values', label: 'Values' },
    { key: 'field_id', label: 'Field ID', format: 'number' },
    { key: 'has_more_values', label: 'Has More Values', format: 'boolean' },
  ],
};

export const metabaseListGlossaryEntriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'term', label: 'Term' },
        { key: 'definition', label: 'Definition' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
      ],
    },
  ],
};

export const metabaseListGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'magic_group_type', label: 'Magic Group Type' },
        { key: 'member_count', label: 'Member Count', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListPopularItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'popular_items',
      label: 'Popular Items',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'model', label: 'Model' },
        { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
        { key: 'moderated_status', label: 'Moderated Status' },
        {
          key: 'parent_collection',
          label: 'Parent Collection',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'database_id', label: 'Database ID' },
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'dataset_query', label: 'Dataset Query' },
        { key: 'display', label: 'Display' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'table_schema', label: 'Table Schema' },
        {
          key: 'database',
          label: 'Database',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'display_name', label: 'Display Name' },
      ],
    },
  ],
};

export const metabaseListRecentViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'recents',
      label: 'Recents',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'model', label: 'Model' },
        { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
        {
          key: 'parent_collection',
          label: 'Parent Collection',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'moderated_status', label: 'Moderated Status' },
        { key: 'database_id', label: 'Database ID', format: 'number' },
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'dataset_query', label: 'Dataset Query' },
        { key: 'display', label: 'Display' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'collection_type', label: 'Collection Type' },
        { key: 'table_schema', label: 'Table Schema' },
        {
          key: 'database',
          label: 'Database',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'display_name', label: 'Display Name' },
      ],
    },
  ],
};

export const metabaseListRevisionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'revisions',
      label: 'Revisions',
      labelKey: 'id',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'most_recent', label: 'Most Recent', format: 'boolean' },
        { key: 'is_creation', label: 'Is Creation', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'is_reversion', label: 'Is Reversion', format: 'boolean' },
        {
          key: 'has_multiple_changes',
          label: 'Has Multiple Changes',
          format: 'boolean',
        },
        { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
        { key: 'user', label: 'User', children: userFields },
        { key: 'message', label: 'Message' },
        {
          key: 'diff',
          label: 'Diff',
          children: [
            { key: 'before', label: 'Before' },
            { key: 'after', label: 'After' },
            { key: 'definition', label: 'Definition' },
            { key: 'description', label: 'Description' },
            { key: 'name', label: 'Name' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListSchemaTablesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'schema', label: 'Schema' },
        { key: 'is_writable', label: 'Is Writable', format: 'boolean' },
        { key: 'database_require_filter', label: 'Database Require Filter' },
        { key: 'collection_id', label: 'Collection ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'transform_target',
          label: 'Transform Target',
          format: 'boolean',
        },
        { key: 'caveats', label: 'Caveats' },
        { key: 'owner_email', label: 'Owner Email' },
        { key: 'transform_id', label: 'Transform ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'is_published', label: 'Is Published', format: 'boolean' },
        { key: 'owner_user_id', label: 'Owner User ID' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'db_id', label: 'DB ID', format: 'number' },
        { key: 'archived_at', label: 'Archived At' },
        { key: 'data_source', label: 'Data Source' },
        { key: 'visibility_type', label: 'Visibility Type' },
        { key: 'deactivated_at', label: 'Deactivated At' },
        { key: 'data_authority', label: 'Data Authority' },
        { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'data_layer', label: 'Data Layer' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'estimated_row_count', label: 'Estimated Row Count' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListSegmentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'segments',
      label: 'Segments',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'table_id', label: 'Table ID', format: 'number' },
        { key: 'description', label: 'Description' },
        { key: 'definition', label: 'Definition' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListSnippetsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'snippets',
      label: 'Snippets',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'content', label: 'Content' },
        { key: 'collection_id', label: 'Collection ID' },
        { key: 'name', label: 'Name' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'template_tags', label: 'Template Tags' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListTableForeignKeysOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'foreignKeys',
      label: 'Foreign Keys',
      listItems: [
        { key: 'relationship', label: 'Relationship' },
        { key: 'origin_id', label: 'Origin ID', format: 'number' },
        {
          key: 'origin',
          label: 'Origin',
          children: [
            { key: 'description', label: 'Description' },
            { key: 'database_type', label: 'Database Type' },
            { key: 'semantic_type', label: 'Semantic Type' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'coercion_strategy', label: 'Coercion Strategy' },
            { key: 'table', label: 'Table' },
            { key: 'database_indexed', label: 'Database Indexed' },
            {
              key: 'dimension_interestingness',
              label: 'Dimension Interestingness',
            },
            { key: 'name', label: 'Name' },
            {
              key: 'fingerprint_version',
              label: 'Fingerprint Version',
              format: 'number',
            },
            { key: 'has_field_values', label: 'Has Field Values' },
            { key: 'database_is_pk', label: 'Database Is PK' },
            { key: 'caveats', label: 'Caveats' },
            {
              key: 'fk_target_field_id',
              label: 'FK Target Field ID',
              format: 'number',
            },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            {
              key: 'custom_position',
              label: 'Custom Position',
              format: 'number',
            },
            { key: 'database_default', label: 'Database Default' },
            { key: 'effective_type', label: 'Effective Type' },
            { key: 'active', label: 'Active', format: 'boolean' },
            { key: 'parent_id', label: 'Parent ID' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'last_analyzed', label: 'Last Analyzed' },
            { key: 'database_partitioned', label: 'Database Partitioned' },
            {
              key: 'database_is_auto_increment',
              label: 'Database Is Auto Increment',
              format: 'boolean',
            },
            {
              key: 'json_unfolding',
              label: 'JSON Unfolding',
              format: 'boolean',
            },
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'visibility_type', label: 'Visibility Type' },
            {
              key: 'preview_display',
              label: 'Preview Display',
              format: 'boolean',
            },
            { key: 'database_is_generated', label: 'Database Is Generated' },
            { key: 'data_sensitivity', label: 'Data Sensitivity' },
            { key: 'display_name', label: 'Display Name' },
            {
              key: 'database_position',
              label: 'Database Position',
              format: 'number',
            },
            {
              key: 'database_required',
              label: 'Database Required',
              format: 'boolean',
            },
            { key: 'database_is_nullable', label: 'Database Is Nullable' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'base_type', label: 'Base Type' },
            { key: 'points_of_interest', label: 'Points Of Interest' },
          ],
        },
        { key: 'destination_id', label: 'Destination ID', format: 'number' },
        {
          key: 'destination',
          label: 'Destination',
          children: [
            { key: 'description', label: 'Description' },
            { key: 'database_type', label: 'Database Type' },
            { key: 'semantic_type', label: 'Semantic Type' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'coercion_strategy', label: 'Coercion Strategy' },
            { key: 'table', label: 'Table' },
            { key: 'database_indexed', label: 'Database Indexed' },
            {
              key: 'dimension_interestingness',
              label: 'Dimension Interestingness',
              format: 'number',
            },
            { key: 'name', label: 'Name' },
            {
              key: 'fingerprint_version',
              label: 'Fingerprint Version',
              format: 'number',
            },
            { key: 'has_field_values', label: 'Has Field Values' },
            { key: 'database_is_pk', label: 'Database Is PK' },
            { key: 'caveats', label: 'Caveats' },
            { key: 'fk_target_field_id', label: 'FK Target Field ID' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            {
              key: 'custom_position',
              label: 'Custom Position',
              format: 'number',
            },
            { key: 'database_default', label: 'Database Default' },
            { key: 'effective_type', label: 'Effective Type' },
            { key: 'active', label: 'Active', format: 'boolean' },
            { key: 'parent_id', label: 'Parent ID' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'last_analyzed', label: 'Last Analyzed' },
            { key: 'database_partitioned', label: 'Database Partitioned' },
            {
              key: 'database_is_auto_increment',
              label: 'Database Is Auto Increment',
              format: 'boolean',
            },
            {
              key: 'json_unfolding',
              label: 'JSON Unfolding',
              format: 'boolean',
            },
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'visibility_type', label: 'Visibility Type' },
            {
              key: 'preview_display',
              label: 'Preview Display',
              format: 'boolean',
            },
            { key: 'database_is_generated', label: 'Database Is Generated' },
            { key: 'data_sensitivity', label: 'Data Sensitivity' },
            { key: 'display_name', label: 'Display Name' },
            {
              key: 'database_position',
              label: 'Database Position',
              format: 'number',
            },
            {
              key: 'database_required',
              label: 'Database Required',
              format: 'boolean',
            },
            { key: 'database_is_nullable', label: 'Database Is Nullable' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'base_type', label: 'Base Type' },
            { key: 'points_of_interest', label: 'Points Of Interest' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListTablesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'name',
      listItems: tablesFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListTimelinesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'timelines',
      label: 'Timelines',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'creator', label: 'Creator', children: creatorFields2 },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'collection_id', label: 'Collection ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'icon', label: 'Icon' },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'collection', label: 'Collection', children: collectionFields2 },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        {
          key: 'events',
          label: 'Events',
          labelKey: 'name',
          listItems: eventsFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const metabaseListUsersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      labelKey: 'email',
      listItems: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'first_name', label: 'First Name' },
        { key: 'is_data_analyst', label: 'Is Data Analyst', format: 'boolean' },
        { key: 'locale', label: 'Locale' },
        { key: 'last_login', label: 'Last Login', format: 'datetime' },
        { key: 'is_active', label: 'Is Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'group_ids', label: 'Group IDs' },
        { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'date_joined', label: 'Date Joined', format: 'datetime' },
        { key: 'common_name', label: 'Common Name' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
  ],
};

export const metabaseMoveCardsOutputSchema: OutputSchema = {
  fields: [{ key: 'status', label: 'Status' }],
};

export const metabaseReactivateUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'is_data_analyst', label: 'Is Data Analyst', format: 'boolean' },
    { key: 'locale', label: 'Locale' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'is_active', label: 'Is Active', format: 'boolean' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'date_joined', label: 'Date Joined', format: 'datetime' },
    { key: 'common_name', label: 'Common Name' },
  ],
};

export const metabaseRemoveGroupMemberOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean' },
    { key: 'membershipId', label: 'Membership ID', format: 'number' },
  ],
};

export const metabaseRevertRevisionOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'most_recent', label: 'Most Recent', format: 'boolean' },
    { key: 'is_creation', label: 'Is Creation', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'is_reversion', label: 'Is Reversion', format: 'boolean' },
    {
      key: 'has_multiple_changes',
      label: 'Has Multiple Changes',
      format: 'boolean',
    },
    { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    { key: 'user', label: 'User', children: userFields },
    { key: 'message', label: 'Message' },
    {
      key: 'diff',
      label: 'Diff',
      children: [
        {
          key: 'before',
          label: 'Before',
          children: [{ key: 'name', label: 'Name' }],
        },
        {
          key: 'after',
          label: 'After',
          children: [{ key: 'name', label: 'Name' }],
        },
      ],
    },
  ],
};

export const metabaseRunCardQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'rows', label: 'Rows' },
        { key: 'cols', label: 'Cols', labelKey: 'name', listItems: colsFields },
        { key: 'native_form', label: 'Native Form' },
        { key: 'results_timezone', label: 'Results Timezone' },
      ],
    },
    { key: 'cached', label: 'Cached' },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    { key: 'status', label: 'Status' },
    { key: 'context', label: 'Context' },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'running_time', label: 'Running Time', format: 'number' },
  ],
};

export const metabaseRunDashboardCardQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Data', children: dataFields },
    { key: 'cached', label: 'Cached' },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    { key: 'status', label: 'Status' },
    { key: 'context', label: 'Context' },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'running_time', label: 'Running Time', format: 'number' },
  ],
};

export const metabaseRunQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'rows', label: 'Rows' },
        {
          key: 'cols',
          label: 'Cols',
          labelKey: 'name',
          listItems: [
            { key: 'description', label: 'Description' },
            { key: 'database_type', label: 'Database Type' },
            { key: 'semantic_type', label: 'Semantic Type' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'lib/deduplicated-name', label: 'Lib Deduplicated Name' },
            { key: 'lib/original-name', label: 'Lib Original Name' },
            { key: 'name', label: 'Name' },
            { key: 'lib/source', label: 'Lib Source' },
            {
              key: 'lib/source-column-alias',
              label: 'Lib Source Column Alias',
            },
            {
              key: 'lib/original-display-name',
              label: 'Lib Original Display Name',
            },
            { key: 'source', label: 'Source' },
            { key: 'field_ref', label: 'Field Ref' },
            { key: 'effective_type', label: 'Effective Type' },
            { key: 'active', label: 'Active', format: 'boolean' },
            { key: 'id', label: 'ID', format: 'number' },
            {
              key: 'lib/desired-column-alias',
              label: 'Lib Desired Column Alias',
            },
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'visibility_type', label: 'Visibility Type' },
            { key: 'display_name', label: 'Display Name' },
            { key: 'base_type', label: 'Base Type' },
            { key: 'lib/external-remap', label: 'Lib External Remap' },
            {
              key: 'fk_target_field_id',
              label: 'FK Target Field ID',
              format: 'number',
            },
            { key: 'remapped_to', label: 'Remapped To' },
            { key: 'options', label: 'Options' },
            { key: 'remapped_from', label: 'Remapped From' },
            { key: 'fk_field_id', label: 'FK Field ID', format: 'number' },
          ],
        },
        { key: 'native_form', label: 'Native Form' },
        { key: 'results_timezone', label: 'Results Timezone' },
      ],
    },
    { key: 'cached', label: 'Cached' },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    { key: 'status', label: 'Status' },
    { key: 'context', label: 'Context' },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'running_time', label: 'Running Time', format: 'number' },
  ],
};

export const metabaseSearchCardParameterValuesOutputSchema: OutputSchema = {
  fields: [
    { key: 'values', label: 'Values' },
    { key: 'has_more_values', label: 'Has More Values', format: 'boolean' },
  ],
};

export const metabaseSearchFieldValuesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Items', value: '' }],
};

export const metabaseSearchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
        { key: 'bookmark', label: 'Bookmark', format: 'boolean' },
        { key: 'last_editor_common_name', label: 'Last Editor Common Name' },
        { key: 'pk_ref', label: 'PK Ref' },
        { key: 'official_collection', label: 'Official Collection' },
        { key: 'name', label: 'Name' },
        { key: 'curated', label: 'Curated', format: 'boolean' },
        { key: 'creator_common_name', label: 'Creator Common Name' },
        {
          key: 'collection_authority_level',
          label: 'Collection Authority Level',
        },
        { key: 'creator_id', label: 'Creator ID', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'moderated_status', label: 'Moderated Status' },
        { key: 'last_editor_id', label: 'Last Editor ID', format: 'number' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_edited_at', label: 'Last Edited At', format: 'datetime' },
        { key: 'context', label: 'Context' },
        {
          key: 'scores',
          label: 'Scores',
          labelKey: 'name',
          listItems: [
            { key: 'score', label: 'Score', format: 'number' },
            { key: 'name', label: 'Name' },
            { key: 'weight', label: 'Weight', format: 'number' },
            { key: 'contribution', label: 'Contribution', format: 'number' },
          ],
        },
        {
          key: 'collection',
          label: 'Collection',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
          ],
        },
        { key: 'verified', label: 'Verified' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'model', label: 'Model' },
        { key: 'display_type', label: 'Display Type' },
        { key: 'database_id', label: 'Database ID', format: 'number' },
        { key: 'query_type', label: 'Query Type' },
        {
          key: 'dashboardcard_count',
          label: 'Dashboardcard Count',
          format: 'number',
        },
        { key: 'display', label: 'Display' },
        { key: 'document_name', label: 'Document Name' },
        { key: 'type', label: 'Type' },
        { key: 'location', label: 'Location' },
      ],
    },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'models', label: 'Models' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'table_db_id', label: 'Table DB ID' },
    { key: 'engine', label: 'Engine' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const metabaseSendAlertOutputSchema: OutputSchema = {
  fields: [
    { key: 'sent', label: 'Sent', format: 'boolean' },
    { key: 'alertId', label: 'Alert ID', format: 'number' },
  ],
};

export const metabaseUpdateActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'dataset_query', label: 'Dataset Query' },
    { key: 'model_id', label: 'Model ID', format: 'number' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'parameter_mappings', label: 'Parameter Mappings' },
    { key: 'entity_id', label: 'Entity ID' },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: parametersFields2,
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
  ],
};

export const metabaseUpdateAlertOutputSchema: OutputSchema = {
  fields: [
    { key: 'payload_id', label: 'Payload ID', format: 'number' },
    {
      key: 'payload',
      label: 'Payload',
      children: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'card_id', label: 'Card ID', format: 'number' },
        { key: 'send_once', label: 'Send Once', format: 'boolean' },
        { key: 'send_condition', label: 'Send Condition' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
        {
          key: 'card',
          label: 'Card',
          children: [
            { key: 'description', label: 'Description' },
            { key: 'archived', label: 'Archived', format: 'boolean' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'database_id', label: 'Database ID', format: 'number' },
            {
              key: 'enable_embedding',
              label: 'Enable Embedding',
              format: 'boolean',
            },
            { key: 'collection_id', label: 'Collection ID', format: 'number' },
            { key: 'query_type', label: 'Query Type' },
            { key: 'name', label: 'Name' },
            { key: 'document_id', label: 'Document ID' },
            { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
            { key: 'type', label: 'Type' },
            { key: 'creator_id', label: 'Creator ID', format: 'number' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            {
              key: 'embedding_params',
              label: 'Embedding Params',
              dynamicKey: true,
            },
            { key: 'cache_ttl', label: 'Cache TTL' },
            { key: 'dataset_query', label: 'Dataset Query' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'parameter_mappings', label: 'Parameter Mappings' },
            { key: 'display', label: 'Display' },
            { key: 'entity_id', label: 'Entity ID' },
            { key: 'parameters', label: 'Parameters' },
            { key: 'dashboard_id', label: 'Dashboard ID' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'public_uuid', label: 'Public UUID' },
          ],
        },
      ],
    },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'payload_type', label: 'Payload Type' },
    {
      key: 'handlers',
      label: 'Handlers',
      labelKey: 'id',
      listItems: [
        { key: 'template_id', label: 'Template ID' },
        { key: 'channel_type', label: 'Channel Type' },
        { key: 'channel', label: 'Channel' },
        { key: 'template', label: 'Template' },
        {
          key: 'recipients',
          label: 'Recipients',
          labelKey: 'id',
          listItems: [
            { key: 'id', label: 'ID', format: 'number' },
            {
              key: 'notification_handler_id',
              label: 'Notification Handler ID',
              format: 'number',
            },
            { key: 'type', label: 'Type' },
            { key: 'user_id', label: 'User ID', format: 'number' },
            { key: 'permissions_group_id', label: 'Permissions Group ID' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'user', label: 'User' },
          ],
        },
        { key: 'channel_id', label: 'Channel ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'notification_id', label: 'Notification ID', format: 'number' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      labelKey: 'id',
      listItems: subscriptionsFields,
    },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseUpdateCardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
    { key: 'creator', label: 'Creator', children: creatorFields },
    { key: 'database_id', label: 'Database ID', format: 'number' },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'query_type', label: 'Query Type' },
    { key: 'name', label: 'Name' },
    { key: 'document_id', label: 'Document ID' },
    { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
    { key: 'dashboard', label: 'Dashboard', children: dashboardFields },
    { key: 'type', label: 'Type' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params', dynamicKey: true },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'dataset_query', label: 'Dataset Query' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'parameter_mappings', label: 'Parameter Mappings' },
    { key: 'display', label: 'Display' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields3 },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: parametersFields3,
    },
    { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
  ],
};

export const metabaseUpdateCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'slug', label: 'Slug' },
    { key: 'name', label: 'Name' },
    { key: 'personal_owner_id', label: 'Personal Owner ID' },
    { key: 'type', label: 'Type' },
    { key: 'parent_id', label: 'Parent ID', format: 'number' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'location', label: 'Location' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseUpdateDashboardOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    {
      key: 'dashcards',
      label: 'Dashcards',
      labelKey: 'id',
      listItems: [
        { key: 'size_x', label: 'Size X', format: 'number' },
        {
          key: 'collection_authority_level',
          label: 'Collection Authority Level',
        },
        {
          key: 'card',
          label: 'Card',
          children: [
            { key: 'description', label: 'Description' },
            { key: 'archived', label: 'Archived', format: 'boolean' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'database_id', label: 'Database ID', format: 'number' },
            {
              key: 'enable_embedding',
              label: 'Enable Embedding',
              format: 'boolean',
            },
            { key: 'collection_id', label: 'Collection ID', format: 'number' },
            { key: 'query_type', label: 'Query Type' },
            { key: 'download_perms', label: 'Download Perms' },
            { key: 'name', label: 'Name' },
            { key: 'document_id', label: 'Document ID' },
            { key: 'last_used_at', label: 'Last Used At', format: 'datetime' },
            { key: 'type', label: 'Type' },
            { key: 'creator_id', label: 'Creator ID', format: 'number' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
            { key: 'embedding_params', label: 'Embedding Params' },
            { key: 'cache_ttl', label: 'Cache TTL' },
            { key: 'dataset_query', label: 'Dataset Query' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'parameter_mappings', label: 'Parameter Mappings' },
            { key: 'display', label: 'Display' },
            { key: 'entity_id', label: 'Entity ID' },
            { key: 'parameters', label: 'Parameters' },
            { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'public_uuid', label: 'Public UUID' },
          ],
        },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'col', label: 'Col', format: 'number' },
        { key: 'id', label: 'ID', format: 'number' },
        {
          key: 'parameter_mappings',
          label: 'Parameter Mappings',
          listItems: parameterMappingsFields,
        },
        { key: 'card_id', label: 'Card ID', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'size_y', label: 'Size Y', format: 'number' },
        { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'row', label: 'Row', format: 'number' },
      ],
    },
    {
      key: 'can_set_cache_policy',
      label: 'Can Set Cache Policy',
      format: 'boolean',
    },
    {
      key: 'tabs',
      label: 'Tabs',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'enable_embedding', label: 'Enable Embedding', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'collection_authority_level', label: 'Collection Authority Level' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'embedding_params', label: 'Embedding Params', dynamicKey: true },
    { key: 'cache_ttl', label: 'Cache TTL' },
    {
      key: 'last_used_param_values',
      label: 'Last Used Param Values',
      dynamicKey: true,
    },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
    { key: 'position', label: 'Position' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields3 },
    {
      key: 'parameters',
      label: 'Parameters',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'type', label: 'Type' },
        { key: 'values_source_type', label: 'Values Source Type' },
        { key: 'values_source_config', label: 'Values Source Config' },
      ],
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'public_uuid', label: 'Public UUID' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseUpdateDashboardSubscriptionOutputSchema: OutputSchema = {
  fields: [
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    {
      key: 'channels',
      label: 'Channels',
      labelKey: 'id',
      listItems: channelsFields,
    },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'cards', label: 'Cards', labelKey: 'name', listItems: cardsFields },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'skip_if_empty', label: 'Skip If Empty', format: 'boolean' },
    { key: 'parameters', label: 'Parameters' },
    { key: 'disable_links', label: 'Disable Links', format: 'boolean' },
    { key: 'dashboard_id', label: 'Dashboard ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseUpdateDatabaseOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'features', label: 'Features' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'auto_run_queries', label: 'Auto Run Queries', format: 'boolean' },
    { key: 'is_stub', label: 'Is Stub', format: 'boolean' },
    { key: 'name', label: 'Name' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'provider_name', label: 'Provider Name' },
    { key: 'cache_ttl', label: 'Cache TTL' },
    { key: 'id', label: 'ID', format: 'number' },
    {
      key: 'schedules',
      label: 'Schedules',
      children: [
        {
          key: 'metadata_sync',
          label: 'Metadata Sync',
          children: metadataSyncFields,
        },
        {
          key: 'cache_field_values',
          label: 'Cache Field Values',
          children: cacheFieldValuesFields,
        },
      ],
    },
    { key: 'engine', label: 'Engine' },
    { key: 'refingerprint', label: 'Refingerprint' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
    { key: 'admin_details', label: 'Admin Details' },
  ],
};

export const metabaseUpdateFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'database_type', label: 'Database Type' },
    { key: 'semantic_type', label: 'Semantic Type' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
    { key: 'coercion_strategy', label: 'Coercion Strategy' },
    { key: 'database_indexed', label: 'Database Indexed' },
    {
      key: 'dimension_interestingness',
      label: 'Dimension Interestingness',
      format: 'number',
    },
    { key: 'name', label: 'Name' },
    {
      key: 'fingerprint_version',
      label: 'Fingerprint Version',
      format: 'number',
    },
    { key: 'has_field_values', label: 'Has Field Values' },
    { key: 'database_is_pk', label: 'Database Is PK' },
    { key: 'caveats', label: 'Caveats' },
    { key: 'fk_target_field_id', label: 'FK Target Field ID' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'custom_position', label: 'Custom Position', format: 'number' },
    { key: 'database_default', label: 'Database Default' },
    { key: 'effective_type', label: 'Effective Type' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'parent_id', label: 'Parent ID' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_analyzed', label: 'Last Analyzed', format: 'datetime' },
    { key: 'database_partitioned', label: 'Database Partitioned' },
    {
      key: 'database_is_auto_increment',
      label: 'Database Is Auto Increment',
      format: 'boolean',
    },
    { key: 'json_unfolding', label: 'JSON Unfolding', format: 'boolean' },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'visibility_type', label: 'Visibility Type' },
    { key: 'target', label: 'Target' },
    { key: 'preview_display', label: 'Preview Display', format: 'boolean' },
    {
      key: 'database_is_generated',
      label: 'Database Is Generated',
      format: 'boolean',
    },
    { key: 'data_sensitivity', label: 'Data Sensitivity' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'database_position', label: 'Database Position', format: 'number' },
    { key: 'database_required', label: 'Database Required', format: 'boolean' },
    {
      key: 'database_is_nullable',
      label: 'Database Is Nullable',
      format: 'boolean',
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'base_type', label: 'Base Type' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseUpdateSnippetOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'content', label: 'Content' },
    { key: 'collection_id', label: 'Collection ID' },
    { key: 'name', label: 'Name' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'template_tags', label: 'Template Tags' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseUpdateTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'entity_type', label: 'Entity Type' },
    { key: 'schema', label: 'Schema' },
    { key: 'is_writable', label: 'Is Writable', format: 'boolean' },
    { key: 'database_require_filter', label: 'Database Require Filter' },
    { key: 'collection_id', label: 'Collection ID' },
    { key: 'name', label: 'Name' },
    { key: 'transform_target', label: 'Transform Target', format: 'boolean' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'database_type', label: 'Database Type' },
        { key: 'semantic_type', label: 'Semantic Type' },
        { key: 'table_id', label: 'Table ID', format: 'number' },
        { key: 'coercion_strategy', label: 'Coercion Strategy' },
        { key: 'database_indexed', label: 'Database Indexed' },
        {
          key: 'dimension_interestingness',
          label: 'Dimension Interestingness',
          format: 'number',
        },
        { key: 'name', label: 'Name' },
        {
          key: 'fingerprint_version',
          label: 'Fingerprint Version',
          format: 'number',
        },
        { key: 'has_field_values', label: 'Has Field Values' },
        { key: 'database_is_pk', label: 'Database Is PK', format: 'boolean' },
        { key: 'caveats', label: 'Caveats' },
        { key: 'fk_target_field_id', label: 'FK Target Field ID' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'custom_position', label: 'Custom Position', format: 'number' },
        { key: 'database_default', label: 'Database Default' },
        { key: 'effective_type', label: 'Effective Type' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'parent_id', label: 'Parent ID' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_analyzed', label: 'Last Analyzed' },
        { key: 'database_partitioned', label: 'Database Partitioned' },
        {
          key: 'database_is_auto_increment',
          label: 'Database Is Auto Increment',
          format: 'boolean',
        },
        { key: 'json_unfolding', label: 'JSON Unfolding', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'visibility_type', label: 'Visibility Type' },
        { key: 'target', label: 'Target' },
        { key: 'preview_display', label: 'Preview Display', format: 'boolean' },
        {
          key: 'database_is_generated',
          label: 'Database Is Generated',
          format: 'boolean',
        },
        { key: 'data_sensitivity', label: 'Data Sensitivity' },
        { key: 'display_name', label: 'Display Name' },
        {
          key: 'database_position',
          label: 'Database Position',
          format: 'number',
        },
        {
          key: 'database_required',
          label: 'Database Required',
          format: 'boolean',
        },
        {
          key: 'database_is_nullable',
          label: 'Database Is Nullable',
          format: 'boolean',
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'base_type', label: 'Base Type' },
        { key: 'points_of_interest', label: 'Points Of Interest' },
      ],
    },
    { key: 'caveats', label: 'Caveats' },
    { key: 'owner_email', label: 'Owner Email' },
    { key: 'transform_id', label: 'Transform ID' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'is_published', label: 'Is Published', format: 'boolean' },
    { key: 'owner_user_id', label: 'Owner User ID' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'db_id', label: 'DB ID', format: 'number' },
    { key: 'archived_at', label: 'Archived At' },
    { key: 'data_source', label: 'Data Source' },
    { key: 'visibility_type', label: 'Visibility Type' },
    { key: 'deactivated_at', label: 'Deactivated At' },
    { key: 'data_authority', label: 'Data Authority' },
    { key: 'is_upload', label: 'Is Upload', format: 'boolean' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'data_layer', label: 'Data Layer' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'estimated_row_count', label: 'Estimated Row Count' },
    { key: 'points_of_interest', label: 'Points Of Interest' },
  ],
};

export const metabaseUpdateTimelineOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'creator', label: 'Creator', children: creatorFields2 },
    { key: 'default', label: 'Default', format: 'boolean' },
    { key: 'collection_id', label: 'Collection ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'icon', label: 'Icon' },
    { key: 'creator_id', label: 'Creator ID', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'collection', label: 'Collection', children: collectionFields3 },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const metabaseUpdateUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'is_data_analyst', label: 'Is Data Analyst', format: 'boolean' },
    { key: 'locale', label: 'Locale' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'is_active', label: 'Is Active', format: 'boolean' },
    {
      key: 'user_group_memberships',
      label: 'User Group Memberships',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'ID', format: 'number' }],
    },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'is_superuser', label: 'Is Superuser', format: 'boolean' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'date_joined', label: 'Date Joined', format: 'datetime' },
    { key: 'common_name', label: 'Common Name' },
  ],
};
