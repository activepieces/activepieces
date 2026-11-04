import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: OutputSchema['fields'] = [
  { key: 'avatar', label: 'Avatar' },
  { key: 'avatar_id', label: 'Avatar ID' },
  { key: 'avatar_type', label: 'Avatar Type' },
  { key: 'image', label: 'Image' },
  { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'user_id', label: 'User ID', format: 'number' },
];

const createdViaFields: OutputSchema['fields'] = [
  { key: 'auth_client_id', label: 'Auth Client ID', format: 'number' },
  { key: 'display', label: 'Display', format: 'boolean' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL' },
];

const objectRefFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'ID', format: 'number' },
];

const appIconConfigFields: OutputSchema['fields'] = [
  { key: 'icon', label: 'Icon' },
  { key: 'icon_id', label: 'Icon ID', format: 'number' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
];

const usageQuotaFields: OutputSchema['fields'] = [
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  { key: 'limit', label: 'Limit', format: 'number' },
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'percent', label: 'Percent Used', format: 'number' },
];

const userUsageQuotaFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  { key: 'limit', label: 'Limit', format: 'number' },
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'percent', label: 'Percent Used', format: 'number' },
];

const presenceFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'signature', label: 'Signature' },
  { key: 'ref_type', label: 'Reference Type' },
  { key: 'ref_id', label: 'Reference ID', format: 'number' },
];

const pushFields: OutputSchema['fields'] = [
  { key: 'channel', label: 'Channel' },
  { key: 'timestamp', label: 'Timestamp', format: 'number' },
  { key: 'signature', label: 'Signature' },
  { key: 'expires_in', label: 'Expires In (Seconds)', format: 'duration' },
];

const profileFields: OutputSchema['fields'] = [
  { key: 'image', label: 'Image' },
  { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'org_id', label: 'Organization ID' },
  { key: 'profile_id', label: 'Profile ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'space_id', label: 'Space ID' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'avatar', label: 'Avatar' },
  { key: 'name', label: 'Name' },
];

const answerFields: OutputSchema['fields'] = [
  { key: 'answer_id', label: 'Answer ID', format: 'number' },
  { key: 'text', label: 'Text' },
];

const appFullConfigFields: OutputSchema['fields'] = [
  { key: 'allow_attachments', label: 'Allow Attachments', format: 'boolean' },
  { key: 'allow_comments', label: 'Allow Comments', format: 'boolean' },
  { key: 'allow_create', label: 'Allow Create', format: 'boolean' },
  { key: 'allow_edit', label: 'Allow Edit', format: 'boolean' },
  { key: 'allow_tags', label: 'Allow Tags', format: 'boolean' },
  {
    key: 'app_item_id_padding',
    label: 'App Item ID Padding',
    format: 'number',
  },
  { key: 'app_item_id_prefix', label: 'App Item ID Prefix' },
  { key: 'approved', label: 'Approved', format: 'boolean' },
  {
    key: 'calendar_color_category_field_id',
    label: 'Calendar Color Category Field ID',
  },
  { key: 'default_view', label: 'Default View' },
  { key: 'description', label: 'Description' },
  {
    key: 'disable_notifications',
    label: 'Disable Notifications',
    format: 'boolean',
  },
  { key: 'external_id', label: 'External ID' },
  { key: 'fivestar', label: 'Five-Star Rating', format: 'boolean' },
  { key: 'fivestar_label', label: 'Five-Star Label' },
  { key: 'icon', label: 'Icon' },
  { key: 'icon_id', label: 'Icon ID', format: 'number' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'name', label: 'Name' },
  { key: 'rsvp', label: 'RSVP', format: 'boolean' },
  { key: 'rsvp_label', label: 'RSVP Label' },
  { key: 'show_app_item_id', label: 'Show App Item ID', format: 'boolean' },
  { key: 'silent_creates', label: 'Silent Creates', format: 'boolean' },
  { key: 'silent_edits', label: 'Silent Edits', format: 'boolean' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'thumbs', label: 'Thumbs Voting', format: 'boolean' },
  { key: 'thumbs_label', label: 'Thumbs Label' },
  { key: 'type', label: 'Type' },
  { key: 'usage', label: 'Usage' },
  { key: 'yesno', label: 'Yes/No Voting', format: 'boolean' },
  { key: 'yesno_label', label: 'Yes/No Label' },
];

const categoryOptionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'text', label: 'Text' },
  { key: 'color', label: 'Color' },
];

const layoutFieldRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'type', label: 'Type' },
];

const layoutFieldKeyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
];

const labelFields: OutputSchema['fields'] = [
  { key: 'color', label: 'Color' },
  { key: 'label_id', label: 'Label ID', format: 'number' },
  { key: 'text', label: 'Text' },
];

const votingFields: OutputSchema['fields'] = [
  { key: 'filter_key', label: 'Filter Key' },
  { key: 'kind', label: 'Kind' },
  { key: 'question', label: 'Question' },
  { key: 'sort_key', label: 'Sort Key' },
  { key: 'voting_id', label: 'Voting ID', format: 'number' },
];

const appConfigFields: OutputSchema['fields'] = [
  { key: 'allow_create', label: 'Allow Create', format: 'boolean' },
  { key: 'allow_edit', label: 'Allow Edit', format: 'boolean' },
  { key: 'description', label: 'Description' },
  { key: 'external_id', label: 'External ID' },
  { key: 'icon', label: 'Icon' },
  { key: 'icon_id', label: 'Icon ID', format: 'number' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'usage', label: 'Usage' },
];

const fileFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'external_file_id', label: 'External File ID' },
  { key: 'file_id', label: 'File ID', format: 'number' },
  { key: 'hosted_by', label: 'Hosted By' },
  { key: 'hosted_by_humanized_name', label: 'Hosted By Name' },
  { key: 'link', label: 'Link' },
  { key: 'link_target', label: 'Link Target' },
  { key: 'mimetype', label: 'MIME Type' },
  { key: 'name', label: 'Name' },
  { key: 'perma_link', label: 'Permalink' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'thumbnail_link', label: 'Thumbnail Link' },
  { key: 'uuid_link', label: 'UUID Link' },
];

const organizationFields: OutputSchema['fields'] = [
  { key: 'contract_status', label: 'Contract Status' },
  { key: 'domains', label: 'Domains' },
  { key: 'image', label: 'Image' },
  { key: 'logo', label: 'Logo' },
  { key: 'name', label: 'Name' },
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  { key: 'premium', label: 'Premium', format: 'boolean' },
  { key: 'segment', label: 'Segment' },
  { key: 'segment_size', label: 'Segment Size', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'tier', label: 'Tier' },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
];

const fieldChangeFields: OutputSchema['fields'] = [
  { key: 'field', label: 'Field' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
];

const valueRangeFields: OutputSchema['fields'] = [
  { key: 'min', label: 'Min', format: 'number' },
  { key: 'max', label: 'Max', format: 'number' },
];

const emailContactFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'mail', label: 'Email', format: 'email' },
];

const dateRangeFields: OutputSchema['fields'] = [
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'start_utc', label: 'Start UTC', format: 'datetime' },
  { key: 'start_date_utc', label: 'Start Date UTC', format: 'date' },
  { key: 'start_time_utc', label: 'Start Time UTC' },
  { key: 'end', label: 'End', format: 'datetime' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  { key: 'end_time', label: 'End Time' },
  { key: 'end_utc', label: 'End UTC', format: 'datetime' },
  { key: 'end_date_utc', label: 'End Date UTC', format: 'date' },
  { key: 'end_time_utc', label: 'End Time UTC' },
];

const fileBasicFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'external_file_id', label: 'External File ID' },
  { key: 'file_id', label: 'File ID', format: 'number' },
  { key: 'hosted_by', label: 'Hosted By' },
  { key: 'hosted_by_humanized_name', label: 'Hosted By Name' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'link_target', label: 'Link Target' },
  { key: 'mimetype', label: 'MIME Type' },
  { key: 'name', label: 'Name' },
  { key: 'perma_link', label: 'Permalink' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'thumbnail_link', label: 'Thumbnail Link' },
  { key: 'uuid_link', label: 'UUID Link' },
];

const eventListFields: OutputSchema['fields'] = [
  { key: 'events', label: 'Events' },
  { key: 'total', label: 'Total', format: 'number' },
];

const organizationBasicFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
];

const contactFields: OutputSchema['fields'] = [
  { key: 'external_id', label: 'External ID' },
  { key: 'image', label: 'Image' },
  { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'org_id', label: 'Organization ID' },
  { key: 'profile_id', label: 'Profile ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'rights', label: 'Rights' },
  { key: 'space_id', label: 'Space ID' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'country', label: 'Country' },
  { key: 'mail', label: 'Email' },
  { key: 'name', label: 'Name' },
];

const linkedContactFields: OutputSchema['fields'] = [
  { key: 'external_id', label: 'External ID' },
  { key: 'external_picture', label: 'External Picture' },
  { key: 'name', label: 'Name' },
  { key: 'mail', label: 'Email' },
];

const revisionBasicFields: OutputSchema['fields'] = [
  { key: 'created_by', label: 'Created By' },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  { key: 'created_via', label: 'Created Via' },
  { key: 'item_revision_id', label: 'Item Revision ID', format: 'number' },
  { key: 'revision', label: 'Revision', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'user', label: 'User' },
];

const fieldDefinitionBasicFields: OutputSchema['fields'] = [
  { key: 'config', label: 'Configuration' },
  { key: 'external_id', label: 'External ID' },
  { key: 'field_id', label: 'Field ID', format: 'number' },
  { key: 'label', label: 'Label' },
  { key: 'revision_from', label: 'Revision From', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
];

const taskListFields: OutputSchema['fields'] = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'total', label: 'Total', format: 'number' },
];

const profileExternalFields: OutputSchema['fields'] = [
  { key: 'external_id', label: 'External ID' },
  { key: 'image', label: 'Image' },
  { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'org_id', label: 'Organization ID' },
  { key: 'profile_id', label: 'Profile ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'space_id', label: 'Space ID' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'country', label: 'Country' },
  { key: 'mail', label: 'Email' },
  { key: 'name', label: 'Name' },
];

const userAccountFields: OutputSchema['fields'] = [
  { key: 'domain', label: 'Domain' },
  { key: 'is_partner', label: 'Partner', format: 'boolean' },
  { key: 'mail', label: 'Email', format: 'email' },
  { key: 'sf_mail', label: 'ShareFile Email' },
  { key: 'user_id', label: 'User ID', format: 'number' },
];

const appPackFields: OutputSchema['fields'] = [
  { key: 'abstract', label: 'Abstract' },
  { key: 'icon', label: 'Icon' },
  { key: 'icon_id', label: 'Icon ID', format: 'number' },
  { key: 'installs', label: 'Installs' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'share_id', label: 'Share ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'visible', label: 'Visible', format: 'boolean' },
];

const itemRefFields: OutputSchema['fields'] = [
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'revision', label: 'Revision', format: 'number' },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
];

const appCategoryFields: OutputSchema['fields'] = [
  { key: 'category_id', label: 'Category ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
];

const dateRangeValueFields: OutputSchema['fields'] = [
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'start_utc', label: 'Start UTC', format: 'datetime' },
  { key: 'start_date_utc', label: 'Start Date UTC', format: 'date' },
  { key: 'start_time_utc', label: 'Start Time UTC' },
  { key: 'end', label: 'End', format: 'datetime' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  { key: 'end_time', label: 'End Time' },
  { key: 'end_utc', label: 'End UTC', format: 'datetime' },
  { key: 'end_date_utc', label: 'End Date UTC', format: 'date' },
  { key: 'end_time_utc', label: 'End Time UTC' },
  { key: 'value', label: 'Value' },
];

const taskTotalFields: OutputSchema['fields'] = [
  {
    key: 'completed_yesterday',
    label: 'Completed Yesterday',
    format: 'number',
  },
  { key: 'overdue', label: 'Overdue', format: 'number' },
  { key: 'today', label: 'Today', format: 'number' },
  { key: 'tomorrow', label: 'Tomorrow', format: 'number' },
  { key: 'upcoming', label: 'Upcoming', format: 'number' },
  { key: 'later', label: 'Later', format: 'number' },
];

const spaceBasicFields: OutputSchema['fields'] = [
  { key: 'item_accounting_info', label: 'Item Usage' },
  { key: 'name', label: 'Name' },
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  { key: 'task_accounting_info', label: 'Task Usage' },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
  { key: 'v8_engine_updated', label: 'V8 Engine Updated', format: 'boolean' },
  { key: 'workflow_accounting_info', label: 'Workflow Usage' },
];

const fieldDefinitionFields: OutputSchema['fields'] = [
  { key: 'config', label: 'Configuration' },
  { key: 'external_id', label: 'External ID' },
  { key: 'field_id', label: 'Field ID', format: 'number' },
  { key: 'label', label: 'Label' },
  { key: 'revision_from', label: 'Revision From', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'values', label: 'Values' },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
];

const appDetailFields: OutputSchema['fields'] = [
  { key: 'app_id', label: 'App ID', format: 'number' },
  {
    key: 'config',
    label: 'Configuration',
    children: appIconConfigFields,
  },
  { key: 'current_revision', label: 'Current Revision', format: 'number' },
  { key: 'default_view_id', label: 'Default View ID', format: 'number' },
  { key: 'icon', label: 'Icon' },
  { key: 'icon_id', label: 'Icon ID', format: 'number' },
  { key: 'is_default', label: 'Default', format: 'boolean' },
  {
    key: 'item_accounting_info',
    label: 'Item Usage',
    children: usageQuotaFields,
  },
  { key: 'item_name', label: 'Item Name' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'link_add', label: 'Add Link', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  { key: 'status', label: 'Status' },
  {
    key: 'task_accounting_info',
    label: 'Task Usage',
    children: userUsageQuotaFields,
  },
  { key: 'url_add', label: 'Add URL', format: 'url' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
  {
    key: 'workflow_accounting_info',
    label: 'Workflow Usage',
    children: usageQuotaFields,
  },
];

const fieldConfigFields: OutputSchema['fields'] = [
  { key: 'default_value', label: 'Default Value' },
  { key: 'delta', label: 'Delta', format: 'number' },
  { key: 'description', label: 'Description' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  {
    key: 'hidden_create_view_edit',
    label: 'Hidden In Create And Edit',
    format: 'boolean',
  },
  { key: 'label', label: 'Label' },
  { key: 'mapping', label: 'Mapping' },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
  { key: 'required', label: 'Required', format: 'boolean' },
  {
    key: 'settings',
    label: 'Settings',
    children: [
      { key: 'size', label: 'Size' },
      { key: 'format', label: 'Format' },
    ],
  },
  { key: 'unique', label: 'Unique', format: 'boolean' },
  { key: 'visible', label: 'Visible', format: 'boolean' },
];

const revisionFields: OutputSchema['fields'] = [
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'item_revision_id', label: 'Item Revision ID', format: 'number' },
  { key: 'revision', label: 'Revision', format: 'number' },
  { key: 'type', label: 'Type' },
  {
    key: 'user',
    label: 'User',
    children: userFields,
  },
];

const ratingFields: OutputSchema['fields'] = [
  { key: 'average', label: 'Average' },
  {
    key: 'counts',
    label: 'Counts',
    dynamicKey: true,
    children: [
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'users', label: 'Users' },
    ],
  },
];

const conversationEventFields: OutputSchema['fields'] = [
  { key: 'action', label: 'Action' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  {
    key: 'data',
    label: 'Data',
    children: profileFields,
  },
  { key: 'event_id', label: 'Event ID', format: 'number' },
];

const votingWithAnswersFields: OutputSchema['fields'] = [
  {
    key: 'answers',
    label: 'Answers',
    listItems: answerFields,
  },
  { key: 'filter_key', label: 'Filter Key' },
  { key: 'kind', label: 'Kind' },
  { key: 'question', label: 'Question' },
  { key: 'sort_key', label: 'Sort Key' },
  { key: 'voting_id', label: 'Voting ID', format: 'number' },
];

const fieldSettingsFields: OutputSchema['fields'] = [
  {
    key: 'options',
    label: 'Options',
    labelKey: 'id',
    listItems: categoryOptionFields,
  },
  { key: 'multiple', label: 'Multiple', format: 'boolean' },
  { key: 'display', label: 'Display' },
  { key: 'calendar', label: 'Calendar', format: 'boolean' },
  { key: 'end', label: 'End' },
  { key: 'time', label: 'Time' },
  { key: 'color', label: 'Color' },
  { key: 'decimals', label: 'Decimals' },
  { key: 'size', label: 'Size' },
  { key: 'format', label: 'Format' },
];

const layoutSlotsFields: OutputSchema['fields'] = [
  {
    key: 'header',
    label: 'Header',
    children: layoutFieldRefFields,
  },
  {
    key: 'content',
    label: 'Content',
    children: layoutFieldRefFields,
  },
  {
    key: 'details_1',
    label: 'Details 1',
    children: layoutFieldRefFields,
  },
  {
    key: 'details_2',
    label: 'Details 2',
    children: layoutFieldRefFields,
  },
  {
    key: 'details_3',
    label: 'Details 3',
    children: layoutFieldKeyFields,
  },
  {
    key: 'footer_1',
    label: 'Footer 1',
    children: layoutFieldKeyFields,
  },
  {
    key: 'footer_2',
    label: 'Footer 2',
    children: layoutFieldKeyFields,
  },
  {
    key: 'footer_3',
    label: 'Footer 3',
    children: layoutFieldKeyFields,
  },
];

const dateRangeOptionFields: OutputSchema['fields'] = [
  {
    key: 'value',
    label: 'Value',
    children: categoryOptionFields,
  },
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'start_utc', label: 'Start UTC', format: 'datetime' },
  { key: 'start_date_utc', label: 'Start Date UTC', format: 'date' },
  { key: 'start_time_utc', label: 'Start Time UTC' },
  { key: 'end', label: 'End', format: 'datetime' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  { key: 'end_time', label: 'End Time' },
  { key: 'end_utc', label: 'End UTC', format: 'datetime' },
  { key: 'end_date_utc', label: 'End Date UTC', format: 'date' },
  { key: 'end_time_utc', label: 'End Time UTC' },
];

const appFields: OutputSchema['fields'] = [
  { key: 'app_id', label: 'App ID', format: 'number' },
  {
    key: 'config',
    label: 'Configuration',
    children: appIconConfigFields,
  },
  { key: 'current_revision', label: 'Current Revision', format: 'number' },
  { key: 'default_view_id', label: 'Default View ID' },
  { key: 'icon', label: 'Icon' },
  { key: 'icon_id', label: 'Icon ID', format: 'number' },
  { key: 'is_default', label: 'Default', format: 'boolean' },
  {
    key: 'item_accounting_info',
    label: 'Item Usage',
    children: usageQuotaFields,
  },
  { key: 'item_name', label: 'Item Name' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'link_add', label: 'Add Link', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  { key: 'status', label: 'Status' },
  {
    key: 'task_accounting_info',
    label: 'Task Usage',
    children: userUsageQuotaFields,
  },
  { key: 'url_add', label: 'Add URL', format: 'url' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
  {
    key: 'workflow_accounting_info',
    label: 'Workflow Usage',
    children: usageQuotaFields,
  },
];

const appBasicFields: OutputSchema['fields'] = [
  { key: 'app_id', label: 'App ID', format: 'number' },
  {
    key: 'config',
    label: 'Configuration',
    children: appConfigFields,
  },
  { key: 'current_revision', label: 'Current Revision', format: 'number' },
  { key: 'default_view_id', label: 'Default View ID' },
  { key: 'is_default', label: 'Default', format: 'boolean' },
  {
    key: 'item_accounting_info',
    label: 'Item Usage',
    children: usageQuotaFields,
  },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'link_add', label: 'Add Link', format: 'url' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  { key: 'status', label: 'Status' },
  {
    key: 'task_accounting_info',
    label: 'Task Usage',
    children: userUsageQuotaFields,
  },
  { key: 'url_add', label: 'Add URL', format: 'url' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
  {
    key: 'workflow_accounting_info',
    label: 'Workflow Usage',
    children: usageQuotaFields,
  },
];

const spaceFields: OutputSchema['fields'] = [
  {
    key: 'item_accounting_info',
    label: 'Item Usage',
    children: usageQuotaFields,
  },
  { key: 'name', label: 'Name' },
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  {
    key: 'task_accounting_info',
    label: 'Task Usage',
    children: userUsageQuotaFields,
  },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
  { key: 'v8_engine_updated', label: 'V8 Engine Updated', format: 'boolean' },
  {
    key: 'workflow_accounting_info',
    label: 'Workflow Usage',
    children: usageQuotaFields,
  },
];

const fieldConfigDeepFields: OutputSchema['fields'] = [
  { key: 'default_value', label: 'Default Value' },
  { key: 'delta', label: 'Delta', format: 'number' },
  { key: 'description', label: 'Description' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  {
    key: 'hidden_create_view_edit',
    label: 'Hidden In Create And Edit',
    format: 'boolean',
  },
  { key: 'label', label: 'Label' },
  { key: 'mapping', label: 'Mapping' },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
  { key: 'required', label: 'Required', format: 'boolean' },
  {
    key: 'settings',
    label: 'Settings',
    children: [
      { key: 'calendar', label: 'Calendar', format: 'boolean' },
      { key: 'end', label: 'End' },
      { key: 'time', label: 'Time' },
      { key: 'color', label: 'Color' },
    ],
  },
  { key: 'unique', label: 'Unique', format: 'boolean' },
  { key: 'visible', label: 'Visible', format: 'boolean' },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'comment_id', label: 'Comment ID', format: 'number' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'embed', label: 'Embed' },
  { key: 'embed_file', label: 'Embed File' },
  { key: 'external_id', label: 'External ID' },
  { key: 'files', label: 'Files' },
  { key: 'is_liked', label: 'Liked', format: 'boolean' },
  { key: 'last_edit_on', label: 'Last Edited', format: 'datetime' },
  { key: 'like_count', label: 'Like Count', format: 'number' },
  { key: 'questions', label: 'Questions' },
  {
    key: 'ref',
    label: 'Reference',
    children: objectRefFields,
  },
  { key: 'rich_value', label: 'Rich Text Value' },
  { key: 'rights', label: 'Rights' },
  {
    key: 'user',
    label: 'User',
    children: userFields,
  },
  { key: 'value', label: 'Value' },
];

const fileDetailFields: OutputSchema['fields'] = [
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'description', label: 'Description' },
  { key: 'external_file_id', label: 'External File ID' },
  { key: 'file_id', label: 'File ID', format: 'number' },
  { key: 'hosted_by', label: 'Hosted By' },
  { key: 'hosted_by_humanized_name', label: 'Hosted By Name' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'link_target', label: 'Link Target' },
  { key: 'mimetype', label: 'MIME Type' },
  { key: 'name', label: 'Name' },
  { key: 'perma_link', label: 'Permalink' },
  { key: 'presence', label: 'Presence' },
  { key: 'push', label: 'Push' },
  { key: 'replaces', label: 'Replaces' },
  { key: 'rights', label: 'Rights' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'thumbnail_link', label: 'Thumbnail Link' },
  { key: 'uuid_link', label: 'UUID Link' },
];

const notificationFields: OutputSchema['fields'] = [
  { key: 'notification_id', label: 'Notification ID', format: 'number' },
  {
    key: 'user',
    label: 'User',
    children: profileFields,
  },
  { key: 'type', label: 'Type' },
  { key: 'starred', label: 'Starred', format: 'boolean' },
  { key: 'viewed_on', label: 'Viewed', format: 'datetime' },
  { key: 'subscription_id', label: 'Subscription ID' },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_by',
    label: 'Created By',
    children: [
      { key: 'avatar', label: 'Avatar', format: 'number' },
      { key: 'avatar_id', label: 'Avatar ID' },
      { key: 'avatar_type', label: 'Avatar Type' },
      { key: 'image', label: 'Image' },
      { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
      { key: 'name', label: 'Name' },
      { key: 'id', label: 'ID', format: 'number' },
      { key: 'type', label: 'Type' },
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'user_id', label: 'User ID', format: 'number' },
    ],
  },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'data', label: 'Data' },
  { key: 'icon', label: 'Icon' },
  { key: 'text', label: 'Text' },
  { key: 'text_short', label: 'Short Text' },
];

const itemSummaryRevisionFields: OutputSchema['fields'] = [
  {
    key: 'app',
    label: 'App',
    children: [
      { key: 'app_id', label: 'App ID', format: 'number' },
      { key: 'config', label: 'Configuration' },
      { key: 'current_revision', label: 'Current Revision', format: 'number' },
      { key: 'default_view_id', label: 'Default View ID' },
      { key: 'icon', label: 'Icon' },
      { key: 'icon_id', label: 'Icon ID', format: 'number' },
      { key: 'is_default', label: 'Default', format: 'boolean' },
      { key: 'item_accounting_info', label: 'Item Usage' },
      { key: 'item_name', label: 'Item Name' },
      { key: 'link', label: 'Link', format: 'url' },
      { key: 'link_add', label: 'Add Link', format: 'url' },
      { key: 'name', label: 'Name' },
      { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
      { key: 'space_id', label: 'Space ID', format: 'number' },
      { key: 'status', label: 'Status' },
      { key: 'task_accounting_info', label: 'Task Usage' },
      { key: 'url_add', label: 'Add URL', format: 'url' },
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'url_label', label: 'URL Label' },
      { key: 'workflow_accounting_info', label: 'Workflow Usage' },
    ],
  },
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'link', label: 'Link' },
  { key: 'revision', label: 'Revision', format: 'number' },
  {
    key: 'initial_revision',
    label: 'Initial Revision',
    children: revisionBasicFields,
  },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
];

const categoryGroupFields: OutputSchema['fields'] = [
  {
    key: 'functional',
    label: 'Functional',
    labelKey: 'name',
    listItems: appCategoryFields,
  },
  { key: 'vertical', label: 'Vertical' },
];

const spaceDetailFields: OutputSchema['fields'] = [
  { key: 'auto_join', label: 'Auto Join', format: 'boolean' },
  {
    key: 'created_by',
    label: 'Created By',
    children: profileFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  { key: 'description', label: 'Description' },
  { key: 'is_overdue', label: 'Overdue', format: 'boolean' },
  {
    key: 'item_accounting_info',
    label: 'Item Usage',
    children: usageQuotaFields,
  },
  { key: 'name', label: 'Name' },
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  {
    key: 'owner',
    label: 'Owner',
    children: objectRefFields,
  },
  { key: 'post_on_new_app', label: 'Post On New App', format: 'boolean' },
  { key: 'post_on_new_member', label: 'Post On New Member', format: 'boolean' },
  { key: 'premium', label: 'Premium', format: 'boolean' },
  { key: 'privacy', label: 'Privacy' },
  {
    key: 'push',
    label: 'Push',
    children: pushFields,
  },
  { key: 'rights', label: 'Rights' },
  { key: 'role', label: 'Role' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
  {
    key: 'task_accounting_info',
    label: 'Task Usage',
    children: userUsageQuotaFields,
  },
  { key: 'tier', label: 'Tier' },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
  { key: 'v8_engine_updated', label: 'V8 Engine Updated', format: 'boolean' },
  { key: 'video', label: 'Video' },
  {
    key: 'workflow_accounting_info',
    label: 'Workflow Usage',
    children: usageQuotaFields,
  },
];

const spaceMemberFields: OutputSchema['fields'] = [
  { key: 'employee', label: 'Employee', format: 'boolean' },
  { key: 'grants', label: 'Grants', format: 'number' },
  { key: 'is_partner', label: 'Partner', format: 'boolean' },
  {
    key: 'profile',
    label: 'Profile',
    children: profileExternalFields,
  },
  { key: 'role', label: 'Role' },
];

const membershipFields: OutputSchema['fields'] = [
  { key: 'ended_on', label: 'Ended', format: 'datetime' },
  { key: 'invited_on', label: 'Invited', format: 'datetime' },
  {
    key: 'profile',
    label: 'Profile',
    children: profileFields,
  },
  { key: 'role', label: 'Role' },
  { key: 'started_on', label: 'Started', format: 'datetime' },
  { key: 'status', label: 'Status' },
  {
    key: 'user',
    label: 'User',
    children: userAccountFields,
  },
];

const spaceWithOrgFields: OutputSchema['fields'] = [
  {
    key: 'item_accounting_info',
    label: 'Item Usage',
    children: usageQuotaFields,
  },
  { key: 'name', label: 'Name' },
  {
    key: 'org',
    label: 'Organization',
    children: organizationFields,
  },
  { key: 'org_id', label: 'Organization ID', format: 'number' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  {
    key: 'task_accounting_info',
    label: 'Task Usage',
    children: userUsageQuotaFields,
  },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'url_label', label: 'URL Label' },
  { key: 'v8_engine_updated', label: 'V8 Engine Updated', format: 'boolean' },
  {
    key: 'workflow_accounting_info',
    label: 'Workflow Usage',
    children: usageQuotaFields,
  },
];

const userDetailFields: OutputSchema['fields'] = [
  { key: 'activated_on', label: 'Activated', format: 'datetime' },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  { key: 'domain', label: 'Domain' },
  { key: 'flags', label: 'Flags' },
  { key: 'from_sharefile', label: 'From ShareFile', format: 'boolean' },
  { key: 'is_partner', label: 'Partner', format: 'boolean' },
  { key: 'locale', label: 'Locale' },
  { key: 'mail', label: 'Email', format: 'email' },
  {
    key: 'mails',
    label: 'Emails',
    listItems: [
      { key: 'disabled', label: 'Disabled', format: 'boolean' },
      { key: 'verified', label: 'Verified', format: 'boolean' },
      { key: 'mail', label: 'Email', format: 'email' },
      { key: 'primary', label: 'Primary', format: 'boolean' },
    ],
  },
  { key: 'sf_mail', label: 'ShareFile Email' },
  { key: 'status', label: 'Status' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'user_id', label: 'User ID', format: 'number' },
];

const fieldDefinitionNestedFields: OutputSchema['fields'] = [
  {
    key: 'config',
    label: 'Configuration',
    children: fieldConfigFields,
  },
  { key: 'external_id', label: 'External ID' },
  { key: 'field_id', label: 'Field ID', format: 'number' },
  { key: 'label', label: 'Label' },
  { key: 'revision_from', label: 'Revision From', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  {
    key: 'values',
    label: 'Values',
    listItems: [{ key: 'value', label: 'Value' }],
  },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
];

const fieldConfigNestedFields: OutputSchema['fields'] = [
  { key: 'default_value', label: 'Default Value' },
  { key: 'delta', label: 'Delta', format: 'number' },
  { key: 'description', label: 'Description' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  {
    key: 'hidden_create_view_edit',
    label: 'Hidden In Create And Edit',
    format: 'boolean',
  },
  { key: 'label', label: 'Label' },
  { key: 'mapping', label: 'Mapping' },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
  { key: 'required', label: 'Required', format: 'boolean' },
  {
    key: 'settings',
    label: 'Settings',
    children: fieldSettingsFields,
  },
  { key: 'unique', label: 'Unique', format: 'boolean' },
  { key: 'visible', label: 'Visible', format: 'boolean' },
];

const badgeFields: OutputSchema['fields'] = [
  { key: 'default', label: 'Default', format: 'boolean' },
  {
    key: 'fields',
    label: 'Fields',
    children: layoutSlotsFields,
  },
];

const flowFields: OutputSchema['fields'] = [
  {
    key: 'config',
    label: 'Configuration',
    children: [{ key: 'field_ids', label: 'Field IDs' }],
  },
  {
    key: 'effects',
    label: 'Effects',
    listItems: [
      {
        key: 'attributes',
        label: 'Attributes',
        labelKey: 'label',
        listItems: [
          { key: 'attribute_id', label: 'Attribute ID' },
          { key: 'label', label: 'Label' },
          { key: 'nullable', label: 'Nullable', format: 'boolean' },
          { key: 'required', label: 'Required', format: 'boolean' },
          { key: 'type', label: 'Type' },
          { key: 'value', label: 'Value' },
          { key: 'substitutions', label: 'Substitutions' },
        ],
      },
      { key: 'config', label: 'Configuration' },
      { key: 'effect_id', label: 'Effect ID', format: 'number' },
      { key: 'type', label: 'Type' },
    ],
  },
  { key: 'execution_count', label: 'Execution Count', format: 'number' },
  { key: 'flow_id', label: 'Flow ID', format: 'number' },
  { key: 'name', label: 'Name' },
  {
    key: 'ref',
    label: 'Reference',
    children: objectRefFields,
  },
  { key: 'type', label: 'Type' },
];

const formFields: OutputSchema['fields'] = [
  { key: 'app_id', label: 'App ID', format: 'number' },
  { key: 'attachments', label: 'Attachments', format: 'boolean' },
  { key: 'domains', label: 'Domains' },
  { key: 'field_ids', label: 'Field IDs' },
  {
    key: 'fields',
    label: 'Fields',
    listItems: [
      { key: 'field_id', label: 'Field ID', format: 'number' },
      { key: 'settings', label: 'Settings' },
    ],
  },
  { key: 'form_id', label: 'Form ID', format: 'number' },
  {
    key: 'settings',
    label: 'Settings',
    children: [
      { key: 'css', label: 'CSS' },
      { key: 'success_page', label: 'Success Page' },
      { key: 'theme', label: 'Theme' },
      { key: 'captcha', label: 'Captcha', format: 'boolean' },
      {
        key: 'text',
        label: 'Text',
        children: [
          { key: 'heading', label: 'Heading' },
          { key: 'description', label: 'Description' },
          { key: 'success', label: 'Success' },
          { key: 'submit', label: 'Submit' },
        ],
      },
    ],
  },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  { key: 'status', label: 'Status' },
];

const itemSummaryFields: OutputSchema['fields'] = [
  {
    key: 'app',
    label: 'App',
    children: appFields,
  },
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  {
    key: 'excerpt',
    label: 'Excerpt',
    children: [
      { key: 'label', label: 'Label' },
      { key: 'text', label: 'Text' },
    ],
  },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'revision', label: 'Revision', format: 'number' },
  {
    key: 'initial_revision',
    label: 'Initial Revision',
    children: revisionFields,
  },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
];

const layoutFields: OutputSchema['fields'] = [
  { key: 'app_id', label: 'App ID', format: 'number' },
  { key: 'default', label: 'Default', format: 'boolean' },
  {
    key: 'fields',
    label: 'Fields',
    children: layoutSlotsFields,
  },
  { key: 'type', label: 'Type' },
];

const calendarEventFields: OutputSchema['fields'] = [
  {
    key: 'app',
    label: 'App',
    children: appFields,
  },
  { key: 'busy', label: 'Busy', format: 'boolean' },
  { key: 'category_text', label: 'Category Text' },
  { key: 'color', label: 'Color' },
  { key: 'description', label: 'Description' },
  { key: 'forged', label: 'Forged', format: 'boolean' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'location', label: 'Location' },
  { key: 'ref_id', label: 'Reference ID', format: 'number' },
  { key: 'ref_type', label: 'Reference Type' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'title', label: 'Title' },
  { key: 'uid', label: 'UID' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'start_utc', label: 'Start UTC', format: 'datetime' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end', label: 'End', format: 'datetime' },
  { key: 'end_utc', label: 'End UTC', format: 'datetime' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  { key: 'end_time', label: 'End Time' },
];

const itemActionFields: OutputSchema['fields'] = [
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'revision', label: 'Revision', format: 'number' },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
  { key: 'action_id', label: 'Action ID', format: 'number' },
  {
    key: 'data',
    label: 'Data',
    children: appBasicFields,
  },
  { key: 'text', label: 'Text' },
  { key: 'type', label: 'Type' },
];

const itemPreviewFields: OutputSchema['fields'] = [
  {
    key: 'app',
    label: 'App',
    children: appFields,
  },
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'revision', label: 'Revision', format: 'number' },
  {
    key: 'initial_revision',
    label: 'Initial Revision',
    children: revisionFields,
  },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
];

const actionItemFields: OutputSchema['fields'] = [
  { key: 'action_id', label: 'Action ID', format: 'number' },
  {
    key: 'data',
    label: 'Data',
    children: appBasicFields,
  },
  { key: 'text', label: 'Text' },
  { key: 'type', label: 'Type' },
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'revision', label: 'Revision', format: 'number' },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
];

const votingResultFields: OutputSchema['fields'] = [
  { key: 'average', label: 'Average' },
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'value', label: 'Value', format: 'number' },
  {
    key: 'values',
    label: 'Values',
    dynamicKey: true,
    children: [
      { key: 'count', label: 'Count', format: 'number' },
      {
        key: 'users',
        label: 'Users',
        labelKey: 'name',
        listItems: profileFields,
      },
    ],
  },
  {
    key: 'voting',
    label: 'Voting',
    children: votingWithAnswersFields,
  },
];

const itemSummaryNestedFields: OutputSchema['fields'] = [
  {
    key: 'app',
    label: 'App',
    children: appFields,
  },
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'link', label: 'Link' },
  { key: 'revision', label: 'Revision', format: 'number' },
  {
    key: 'initial_revision',
    label: 'Initial Revision',
    children: revisionFields,
  },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
];

const fieldChangeNestedFields: OutputSchema['fields'] = [
  {
    key: 'field',
    label: 'Field',
    children: [
      {
        key: 'config',
        label: 'Configuration',
        children: [
          { key: 'default_value', label: 'Default Value' },
          { key: 'delta', label: 'Delta', format: 'number' },
          { key: 'description', label: 'Description' },
          { key: 'hidden', label: 'Hidden', format: 'boolean' },
          {
            key: 'hidden_create_view_edit',
            label: 'Hidden In Create And Edit',
            format: 'boolean',
          },
          { key: 'label', label: 'Label' },
          { key: 'mapping', label: 'Mapping' },
          { key: 'read_only', label: 'Read Only', format: 'boolean' },
          { key: 'required', label: 'Required', format: 'boolean' },
          { key: 'settings', label: 'Settings' },
          { key: 'unique', label: 'Unique', format: 'boolean' },
          { key: 'visible', label: 'Visible', format: 'boolean' },
        ],
      },
      { key: 'external_id', label: 'External ID' },
      { key: 'field_id', label: 'Field ID', format: 'number' },
      { key: 'label', label: 'Label' },
      { key: 'revision_from', label: 'Revision From', format: 'number' },
      { key: 'status', label: 'Status' },
      { key: 'type', label: 'Type' },
    ],
  },
  {
    key: 'from',
    label: 'From',
    listItems: [{ key: 'value', label: 'Value' }],
  },
  {
    key: 'to',
    label: 'To',
    listItems: [{ key: 'value', label: 'Value' }],
  },
];

const taskListNestedFields: OutputSchema['fields'] = [
  {
    key: 'tasks',
    label: 'Tasks',
    listItems: [
      { key: 'description', label: 'Description' },
      { key: 'due_date', label: 'Due Date', format: 'date' },
      { key: 'due_on', label: 'Due At', format: 'datetime' },
      { key: 'due_time', label: 'Due Time' },
      { key: 'external_id', label: 'External ID' },
      { key: 'link', label: 'Link', format: 'url' },
      { key: 'private', label: 'Private', format: 'boolean' },
      {
        key: 'responsible',
        label: 'Responsible',
        children: profileFields,
      },
      { key: 'space_id', label: 'Space ID', format: 'number' },
      { key: 'status', label: 'Status' },
      { key: 'task_id', label: 'Task ID', format: 'number' },
      { key: 'text', label: 'Text' },
    ],
  },
  { key: 'total', label: 'Total', format: 'number' },
];

const ratingSummaryFields: OutputSchema['fields'] = [
  { key: 'average', label: 'Average' },
  {
    key: 'counts',
    label: 'Counts',
    dynamicKey: true,
    children: [
      { key: 'total', label: 'Total', format: 'number' },
      {
        key: 'users',
        label: 'Users',
        labelKey: 'name',
        listItems: profileFields,
      },
    ],
  },
];

const searchResultFields: OutputSchema['fields'] = [
  {
    key: 'app',
    label: 'App',
    children: [
      { key: 'app_id', label: 'App ID', format: 'number' },
      {
        key: 'config',
        label: 'Configuration',
        children: appConfigFields,
      },
      { key: 'current_revision', label: 'Current Revision', format: 'number' },
      { key: 'default_view_id', label: 'Default View ID' },
      { key: 'is_default', label: 'Default', format: 'boolean' },
      {
        key: 'item_accounting_info',
        label: 'Item Usage',
        children: usageQuotaFields,
      },
      { key: 'link', label: 'Link', format: 'url' },
      { key: 'link_add', label: 'Add Link', format: 'url' },
      { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
      { key: 'space_id', label: 'Space ID', format: 'number' },
      { key: 'status', label: 'Status' },
      {
        key: 'task_accounting_info',
        label: 'Task Usage',
        children: userUsageQuotaFields,
      },
      { key: 'url_add', label: 'Add URL', format: 'url' },
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'url_label', label: 'URL Label' },
      {
        key: 'workflow_accounting_info',
        label: 'Workflow Usage',
        children: usageQuotaFields,
      },
      { key: 'rights', label: 'Rights' },
    ],
  },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  { key: 'highlight', label: 'Highlight' },
  { key: 'id', label: 'ID', format: 'number' },
  {
    key: 'item',
    label: 'Item',
    children: itemRefFields,
  },
  { key: 'link', label: 'Link', format: 'url' },
  {
    key: 'org',
    label: 'Organization',
    children: organizationFields,
  },
  { key: 'rank', label: 'Rank', format: 'number' },
  { key: 'search_id', label: 'Search ID' },
  {
    key: 'space',
    label: 'Space',
    children: spaceFields,
  },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
];

const badgeNestedFields: OutputSchema['fields'] = [
  { key: 'default', label: 'Default', format: 'boolean' },
  {
    key: 'fields',
    label: 'Fields',
    children: [
      {
        key: 'header',
        label: 'Header',
        children: layoutFieldRefFields,
      },
      {
        key: 'content',
        label: 'Content',
        children: layoutFieldRefFields,
      },
      {
        key: 'details_1',
        label: 'Details 1',
        children: layoutFieldKeyFields,
      },
      {
        key: 'details_2',
        label: 'Details 2',
        children: layoutFieldKeyFields,
      },
      {
        key: 'details_3',
        label: 'Details 3',
        children: layoutFieldKeyFields,
      },
      {
        key: 'footer_1',
        label: 'Footer 1',
        children: layoutFieldKeyFields,
      },
      {
        key: 'footer_2',
        label: 'Footer 2',
        children: layoutFieldKeyFields,
      },
      {
        key: 'footer_3',
        label: 'Footer 3',
        children: layoutFieldKeyFields,
      },
    ],
  },
];

const layoutBadgesFields: OutputSchema['fields'] = [
  {
    key: 'badge_v2',
    label: 'Badge V2',
    children: badgeFields,
  },
  {
    key: 'badge',
    label: 'Badge',
    children: badgeFields,
  },
  {
    key: 'relationship',
    label: 'Relationship',
    children: [
      { key: 'default', label: 'Default', format: 'boolean' },
      {
        key: 'fields',
        label: 'Fields',
        children: [
          {
            key: 'header',
            label: 'Header',
            children: layoutFieldRefFields,
          },
          {
            key: 'details_1',
            label: 'Details 1',
            children: layoutFieldRefFields,
          },
          {
            key: 'details_2',
            label: 'Details 2',
            children: layoutFieldRefFields,
          },
          { key: 'details_3', label: 'Details 3' },
          { key: 'details_4', label: 'Details 4' },
        ],
      },
    ],
  },
  {
    key: 'card',
    label: 'Card',
    children: [
      { key: 'default', label: 'Default', format: 'boolean' },
      {
        key: 'fields',
        label: 'Fields',
        children: [
          {
            key: 'header',
            label: 'Header',
            children: layoutFieldRefFields,
          },
          {
            key: 'content',
            label: 'Content',
            children: layoutFieldRefFields,
          },
          {
            key: 'details_1',
            label: 'Details 1',
            children: layoutFieldRefFields,
          },
          {
            key: 'details_2',
            label: 'Details 2',
            children: layoutFieldRefFields,
          },
          {
            key: 'details_3',
            label: 'Details 3',
            children: layoutFieldKeyFields,
          },
        ],
      },
    ],
  },
];

const fieldDefinitionDeepFields: OutputSchema['fields'] = [
  {
    key: 'config',
    label: 'Configuration',
    children: fieldConfigNestedFields,
  },
  { key: 'external_id', label: 'External ID' },
  { key: 'field_id', label: 'Field ID', format: 'number' },
  { key: 'label', label: 'Label' },
  { key: 'revision_from', label: 'Revision From', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  {
    key: 'values',
    label: 'Values',
    listItems: dateRangeOptionFields,
  },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
];

const referenceDetailFields: OutputSchema['fields'] = [
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  {
    key: 'data',
    label: 'Data',
    children: itemSummaryFields,
  },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'type_name', label: 'Type Name' },
];

const referenceBasicFields: OutputSchema['fields'] = [
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  { key: 'created_via', label: 'Created Via' },
  {
    key: 'data',
    label: 'Data',
    children: [
      { key: 'app_id', label: 'App ID', format: 'number' },
      {
        key: 'config',
        label: 'Configuration',
        children: appIconConfigFields,
      },
      { key: 'current_revision', label: 'Current Revision', format: 'number' },
      { key: 'default_view_id', label: 'Default View ID' },
      { key: 'icon', label: 'Icon' },
      { key: 'icon_id', label: 'Icon ID', format: 'number' },
      { key: 'is_default', label: 'Default', format: 'boolean' },
      {
        key: 'item_accounting_info',
        label: 'Item Usage',
        children: usageQuotaFields,
      },
      { key: 'item_name', label: 'Item Name' },
      { key: 'link', label: 'Link', format: 'url' },
      { key: 'link_add', label: 'Add Link', format: 'url' },
      { key: 'name', label: 'Name' },
      { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
      {
        key: 'space',
        label: 'Space',
        children: spaceFields,
      },
      { key: 'space_id', label: 'Space ID', format: 'number' },
      { key: 'status', label: 'Status' },
      {
        key: 'task_accounting_info',
        label: 'Task Usage',
        children: userUsageQuotaFields,
      },
      { key: 'url_add', label: 'Add URL', format: 'url' },
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'url_label', label: 'URL Label' },
      {
        key: 'workflow_accounting_info',
        label: 'Workflow Usage',
        children: usageQuotaFields,
      },
    ],
  },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'type_name', label: 'Type Name' },
];

const taskSummaryFields: OutputSchema['fields'] = [
  {
    key: 'overdue',
    label: 'Overdue',
    children: taskListFields,
  },
  {
    key: 'today',
    label: 'Today',
    children: taskListFields,
  },
  {
    key: 'other',
    label: 'Other',
    children: taskListNestedFields,
  },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'comments', label: 'Comments' },
  { key: 'completed_by', label: 'Completed By' },
  { key: 'completed_on', label: 'Completed', format: 'datetime' },
  { key: 'completed_via', label: 'Completed Via' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'description', label: 'Description' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'due_on', label: 'Due At', format: 'datetime' },
  { key: 'due_time', label: 'Due Time' },
  { key: 'external_id', label: 'External ID' },
  { key: 'files', label: 'Files' },
  {
    key: 'labels',
    label: 'Labels',
    listItems: labelFields,
  },
  { key: 'link', label: 'Link', format: 'url' },
  {
    key: 'presence',
    label: 'Presence',
    children: presenceFields,
  },
  { key: 'private', label: 'Private', format: 'boolean' },
  {
    key: 'push',
    label: 'Push',
    children: pushFields,
  },
  { key: 'recurrence', label: 'Recurrence' },
  {
    key: 'ref',
    label: 'Reference',
    children: referenceDetailFields,
  },
  { key: 'reminder', label: 'Reminder' },
  {
    key: 'responsible',
    label: 'Responsible',
    children: profileFields,
  },
  { key: 'rights', label: 'Rights' },
  { key: 'space_id', label: 'Space ID', format: 'number' },
  { key: 'started', label: 'Started', format: 'boolean' },
  { key: 'status', label: 'Status' },
  { key: 'task_id', label: 'Task ID', format: 'number' },
  { key: 'text', label: 'Text' },
];

const itemListFields: OutputSchema['fields'] = [
  { key: 'app_item_id', label: 'App Item ID', format: 'number' },
  { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
  { key: 'comment_count', label: 'Comment Count', format: 'number' },
  {
    key: 'created_by',
    label: 'Created By',
    children: userFields,
  },
  { key: 'created_on', label: 'Created', format: 'datetime' },
  {
    key: 'created_via',
    label: 'Created Via',
    children: createdViaFields,
  },
  { key: 'external_id', label: 'External ID' },
  {
    key: 'fields',
    label: 'Fields',
    labelKey: 'label',
    listItems: [
      {
        key: 'config',
        label: 'Configuration',
        children: [
          { key: 'label', label: 'Label' },
          { key: 'mapping', label: 'Mapping' },
          {
            key: 'settings',
            label: 'Settings',
            children: fieldSettingsFields,
          },
        ],
      },
      { key: 'external_id', label: 'External ID' },
      { key: 'field_id', label: 'Field ID', format: 'number' },
      { key: 'label', label: 'Label' },
      { key: 'revision_from', label: 'Revision From', format: 'number' },
      { key: 'type', label: 'Type' },
      {
        key: 'values',
        label: 'Values',
        listItems: dateRangeOptionFields,
      },
      { key: 'read_only', label: 'Read Only', format: 'boolean' },
    ],
  },
  { key: 'file_count', label: 'File Count', format: 'number' },
  { key: 'item_id', label: 'Item ID', format: 'number' },
  { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'priority', label: 'Priority', format: 'number' },
  {
    key: 'ratings',
    label: 'Ratings',
    children: [
      {
        key: 'like',
        label: 'Like',
        children: ratingFields,
      },
    ],
  },
  { key: 'revision', label: 'Revision', format: 'number' },
  {
    key: 'current_revision',
    label: 'Current Revision',
    children: revisionFields,
  },
  {
    key: 'initial_revision',
    label: 'Initial Revision',
    children: revisionFields,
  },
  { key: 'rights', label: 'Rights' },
  { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
  { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
  { key: 'title', label: 'Title' },
];

export const createCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'comment_id', label: 'Comment ID', format: 'number' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'embed', label: 'Embed' },
    { key: 'embed_file', label: 'Embed File' },
    { key: 'external_id', label: 'External ID' },
    { key: 'files', label: 'Files' },
    { key: 'granted_users', label: 'Granted Users' },
    { key: 'invited_users', label: 'Invited Users' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'last_edit_on', label: 'Last Edited', format: 'datetime' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'questions', label: 'Questions' },
    {
      key: 'ref',
      label: 'Reference',
      children: objectRefFields,
    },
    { key: 'rich_value', label: 'Rich Text Value' },
    { key: 'rights', label: 'Rights' },
    {
      key: 'user',
      label: 'User',
      children: userFields,
    },
    { key: 'value', label: 'Value' },
  ],
};

export const createItemOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'app',
      label: 'App',
      children: appDetailFields,
    },
    { key: 'app_item_id', label: 'App Item ID', format: 'number' },
    { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'external_id', label: 'External ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: fieldDefinitionNestedFields,
    },
    { key: 'item_id', label: 'Item ID', format: 'number' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'linked_account_data', label: 'Linked Account Data' },
    { key: 'linked_account_id', label: 'Linked Account ID' },
    { key: 'participants', label: 'Participants' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'priority', label: 'Priority', format: 'number' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'revision', label: 'Revision', format: 'number' },
    {
      key: 'current_revision',
      label: 'Current Revision',
      children: revisionFields,
    },
    {
      key: 'initial_revision',
      label: 'Initial Revision',
      children: revisionFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'title', label: 'Title' },
  ],
};

export const createStatusOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'embed', label: 'Embed' },
    { key: 'embed_file', label: 'Embed File' },
    { key: 'files', label: 'Files' },
    { key: 'last_edit_on', label: 'Last Edited', format: 'datetime' },
    { key: 'link', label: 'Link', format: 'url' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'questions', label: 'Questions' },
    { key: 'rich_value', label: 'Rich Text Value' },
    { key: 'rights', label: 'Rights' },
    { key: 'status_id', label: 'Status ID', format: 'number' },
    {
      key: 'user',
      label: 'User',
      children: userFields,
    },
    { key: 'value', label: 'Value' },
  ],
};

export const createTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'comments', label: 'Comments' },
    { key: 'completed_by', label: 'Completed By' },
    { key: 'completed_on', label: 'Completed', format: 'datetime' },
    { key: 'completed_via', label: 'Completed Via' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'description', label: 'Description' },
    { key: 'due_date', label: 'Due Date', format: 'date' },
    { key: 'due_on', label: 'Due At', format: 'datetime' },
    { key: 'due_time', label: 'Due Time' },
    { key: 'external_id', label: 'External ID' },
    { key: 'files', label: 'Files' },
    { key: 'labels', label: 'Labels' },
    { key: 'link', label: 'Link', format: 'url' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'private', label: 'Private', format: 'boolean' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'reminder', label: 'Reminder' },
    {
      key: 'responsible',
      label: 'Responsible',
      children: profileFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'space_id', label: 'Space ID' },
    { key: 'started', label: 'Started', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'task_id', label: 'Task ID', format: 'number' },
    { key: 'text', label: 'Text' },
  ],
};

export const findItemOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'app',
      label: 'App',
      children: appDetailFields,
    },
    { key: 'app_item_id', label: 'App Item ID', format: 'number' },
    { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
    { key: 'comments', label: 'Comments' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'external_id', label: 'External ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: fieldDefinitionNestedFields,
    },
    { key: 'files', label: 'Files' },
    { key: 'invite', label: 'Invite' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'item_id', label: 'Item ID', format: 'number' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'linked_account_data', label: 'Linked Account Data' },
    { key: 'linked_account_id', label: 'Linked Account ID' },
    { key: 'participants', label: 'Participants' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'priority', label: 'Priority', format: 'number' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    {
      key: 'ratings',
      label: 'Ratings',
      children: [
        {
          key: 'like',
          label: 'Like',
          children: ratingFields,
        },
      ],
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'refs', label: 'References' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'revision', label: 'Revision', format: 'number' },
    {
      key: 'current_revision',
      label: 'Current Revision',
      children: revisionFields,
    },
    {
      key: 'initial_revision',
      label: 'Initial Revision',
      children: revisionFields,
    },
    {
      key: 'revisions',
      label: 'Revisions',
      listItems: revisionFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'tags', label: 'Tags' },
    { key: 'title', label: 'Title' },
    {
      key: 'user_ratings',
      label: 'User Ratings',
      children: [{ key: 'like', label: 'Like' }],
    },
    { key: 'filtered', label: 'Filtered', format: 'number' },
    {
      key: 'items',
      label: 'Items',
      labelKey: 'title',
      listItems: itemListFields,
    },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const findTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'comments', label: 'Comments' },
    { key: 'completed_by', label: 'Completed By' },
    { key: 'completed_on', label: 'Completed', format: 'datetime' },
    { key: 'completed_via', label: 'Completed Via' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'description', label: 'Description' },
    { key: 'due_date', label: 'Due Date', format: 'date' },
    { key: 'due_on', label: 'Due At', format: 'datetime' },
    { key: 'due_time', label: 'Due Time' },
    { key: 'external_id', label: 'External ID' },
    { key: 'files', label: 'Files' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'labels', label: 'Labels' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'private', label: 'Private', format: 'boolean' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'reminder', label: 'Reminder' },
    {
      key: 'responsible',
      label: 'Responsible',
      children: profileFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'space_id', label: 'Space ID' },
    { key: 'started', label: 'Started', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'task_id', label: 'Task ID', format: 'number' },
    { key: 'text', label: 'Text' },
  ],
};

export const newItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'hook_id', label: 'Hook ID' },
    { key: 'item_id', label: 'Item ID' },
    { key: 'item_revision_id', label: 'Item Revision ID' },
  ],
};

export const podioAddConversationParticipantsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'participants',
      label: 'Participants',
      value: '',
      listItems: conversationEventFields,
    },
  ],
};

export const podioAddRatingOutputSchema: OutputSchema = {
  fields: [{ key: 'rating_id', label: 'Rating ID', format: 'number' }],
};

export const podioBatchUpdateVotingsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'votings',
      label: 'Votings',
      value: '',
      listItems: votingWithAnswersFields,
    },
  ],
};

export const podioBulkDeleteItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted' },
    { key: 'pending', label: 'Pending' },
  ],
};

export const podioCalculateItemsOutputSchema: OutputSchema = {
  fields: [{ key: 'total', label: 'Total', format: 'number' }],
};

export const podioCloneItemOutputSchema: OutputSchema = {
  fields: [{ key: 'item_id', label: 'Item ID', format: 'number' }],
};

export const podioCloneWidgetOutputSchema: OutputSchema = {
  fields: [
    { key: 'allowed_refs', label: 'Allowed References' },
    { key: 'cols', label: 'Cols', format: 'number' },
    {
      key: 'config',
      label: 'Configuration',
      children: [{ key: 'text', label: 'Text' }],
    },
    {
      key: 'created_by',
      label: 'Created By',
      children: profileFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'data', label: 'Data' },
    {
      key: 'ref',
      label: 'Reference',
      children: objectRefFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'rows', label: 'Rows', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'widget_id', label: 'Widget ID', format: 'number' },
    { key: 'x', label: 'X Position', format: 'number' },
    { key: 'y', label: 'Y Position', format: 'number' },
  ],
};

export const podioCompleteTaskOutputSchema: OutputSchema = {
  fields: [{ key: 'recurring_task_id', label: 'Recurring Task ID' }],
};

export const podioCopyFileOutputSchema: OutputSchema = {
  fields: [{ key: 'file_id', label: 'File ID', format: 'number' }],
};

export const podioCountObjectTasksOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const podioCountSpaceMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'internal', label: 'Internal', format: 'number' },
    { key: 'external', label: 'External', format: 'number' },
  ],
};

export const podioCreateAnswerInVotingOutputSchema: OutputSchema = {
  fields: answerFields,
};

export const podioCreateAppOutputSchema: OutputSchema = {
  fields: [
    { key: 'app_id', label: 'App ID', format: 'number' },
    {
      key: 'config',
      label: 'Configuration',
      children: appFullConfigFields,
    },
    { key: 'current_revision', label: 'Current Revision', format: 'number' },
    { key: 'default_view_id', label: 'Default View ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: [
        {
          key: 'config',
          label: 'Configuration',
          children: fieldConfigNestedFields,
        },
        { key: 'external_id', label: 'External ID' },
        { key: 'field_id', label: 'Field ID', format: 'number' },
        { key: 'label', label: 'Label' },
        { key: 'revision_from', label: 'Revision From', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'integration', label: 'Integration' },
    { key: 'is_default', label: 'Default', format: 'boolean' },
    {
      key: 'item_accounting_info',
      label: 'Item Usage',
      children: usageQuotaFields,
    },
    {
      key: 'layouts',
      label: 'Layouts',
      children: layoutBadgesFields,
    },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'link_add', label: 'Add Link', format: 'url' },
    { key: 'original', label: 'Original' },
    { key: 'original_revision', label: 'Original Revision' },
    {
      key: 'owner',
      label: 'Owner',
      children: profileFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'space_id', label: 'Space ID', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    {
      key: 'task_accounting_info',
      label: 'Task Usage',
      children: userUsageQuotaFields,
    },
    { key: 'url_add', label: 'Add URL', format: 'url' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'url_label', label: 'URL Label' },
    {
      key: 'workflow_accounting_info',
      label: 'Workflow Usage',
      children: usageQuotaFields,
    },
    { key: 'mailbox', label: 'Mailbox' },
  ],
};

export const podioCreateAppFieldOutputSchema: OutputSchema = {
  fields: [{ key: 'field_id', label: 'Field ID', format: 'number' }],
};

export const podioCreateConversationOutputSchema: OutputSchema = {
  fields: [
    { key: 'conversation_id', label: 'Conversation ID', format: 'number' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'excerpt', label: 'Excerpt' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    {
      key: 'participants',
      label: 'Participants',
      labelKey: 'name',
      listItems: profileFields,
    },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'starred', label: 'Starred', format: 'boolean' },
    { key: 'subject', label: 'Subject' },
    { key: 'type', label: 'Type' },
    { key: 'unread', label: 'Unread', format: 'boolean' },
    { key: 'unread_count', label: 'Unread Count', format: 'number' },
  ],
};

export const podioCreateConversationOnObjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'conversation_id', label: 'Conversation ID', format: 'number' },
    { key: 'message_id', label: 'Message ID', format: 'number' },
    { key: 'embed_id', label: 'Embed ID' },
    { key: 'embed_file_id', label: 'Embed File ID' },
  ],
};

export const podioCreateEmbedOutputSchema: OutputSchema = {
  fields: [
    { key: 'description', label: 'Description' },
    { key: 'embed_height', label: 'Embed Height' },
    { key: 'embed_html', label: 'Embed HTML' },
    { key: 'embed_id', label: 'Embed ID', format: 'number' },
    { key: 'embed_width', label: 'Embed Width' },
    {
      key: 'files',
      label: 'Files',
      labelKey: 'name',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'external_file_id', label: 'External File ID' },
        { key: 'file_id', label: 'File ID', format: 'number' },
        { key: 'hosted_by', label: 'Hosted By' },
        { key: 'hosted_by_humanized_name', label: 'Hosted By Name' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'link_target', label: 'Link Target' },
        { key: 'mimetype', label: 'MIME Type' },
        { key: 'name', label: 'Name' },
        { key: 'perma_link', label: 'Permalink' },
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'thumbnail_link', label: 'Thumbnail Link', format: 'image' },
        { key: 'uuid_link', label: 'UUID Link' },
      ],
    },
    { key: 'hostname', label: 'Hostname' },
    { key: 'original_url', label: 'Original URL', format: 'url' },
    { key: 'resolved_url', label: 'Resolved URL', format: 'url' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const podioCreateFlowOutputSchema: OutputSchema = {
  fields: flowFields,
};

export const podioCreateFormOutputSchema: OutputSchema = {
  fields: formFields,
};

export const podioCreateItemOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'app',
      label: 'App',
      children: appDetailFields,
    },
    { key: 'app_item_id', label: 'App Item ID', format: 'number' },
    { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'external_id', label: 'External ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: fieldDefinitionDeepFields,
    },
    { key: 'item_id', label: 'Item ID', format: 'number' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'linked_account_data', label: 'Linked Account Data' },
    { key: 'linked_account_id', label: 'Linked Account ID' },
    { key: 'participants', label: 'Participants' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'priority', label: 'Priority', format: 'number' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'revision', label: 'Revision', format: 'number' },
    {
      key: 'current_revision',
      label: 'Current Revision',
      children: revisionFields,
    },
    {
      key: 'initial_revision',
      label: 'Initial Revision',
      children: revisionFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'title', label: 'Title' },
  ],
};

export const podioCreateOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'org_id', label: 'Organization ID', format: 'number' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'url_label', label: 'URL Label' },
  ],
};

export const podioCreateOrganizationAppStoreProfileOutputSchema: OutputSchema =
  {
    fields: [{ key: 'profile_id', label: 'Profile ID', format: 'number' }],
  };

export const podioCreateQuestionOutputSchema: OutputSchema = {
  fields: [{ key: 'question_id', label: 'Question ID', format: 'number' }],
};

export const podioCreateSpaceOutputSchema: OutputSchema = {
  fields: [
    { key: 'space_id', label: 'Space ID', format: 'number' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'full_url', label: 'Full URL', format: 'url' },
  ],
};

export const podioCreateTaskOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const podioCreateTaskLabelOutputSchema: OutputSchema = {
  fields: [{ key: 'label_id', label: 'Label ID', format: 'number' }],
};

export const podioCreateViewOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'created_by',
      label: 'Created By',
      children: profileFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'field_visibility_revision', label: 'Field Visibility Revision' },
    { key: 'fields', label: 'Fields' },
    { key: 'filter_id', label: 'Filter ID', format: 'number' },
    { key: 'filters', label: 'Filters' },
    { key: 'grouping', label: 'Grouping' },
    { key: 'groupings', label: 'Groupings' },
    { key: 'items', label: 'Items', format: 'number' },
    { key: 'layout', label: 'Layout' },
    { key: 'name', label: 'Name' },
    { key: 'private', label: 'Private', format: 'boolean' },
    { key: 'rights', label: 'Rights' },
    { key: 'sort_by', label: 'Sort By' },
    { key: 'sort_desc', label: 'Sort Desc', format: 'boolean' },
    { key: 'type', label: 'Type' },
    { key: 'view_id', label: 'View ID', format: 'number' },
  ],
};

export const podioCreateVotingOutputSchema: OutputSchema = {
  fields: votingWithAnswersFields,
};

export const podioDeleteAppFieldOutputSchema: OutputSchema = {
  fields: [{ key: 'revision', label: 'Revision', format: 'number' }],
};

export const podioDeleteCustomLayoutOutputSchema: OutputSchema = {
  fields: layoutFields,
};

export const podioExportItemsOutputSchema: OutputSchema = {
  fields: [{ key: 'batch_id', label: 'Batch ID', format: 'number' }],
};

export const podioFilterAppCalendarOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      children: [
        {
          key: 'events',
          label: 'Events',
          labelKey: 'title',
          listItems: calendarEventFields,
        },
        { key: 'filtered', label: 'Filtered', format: 'number' },
        { key: 'total', label: 'Total', format: 'number' },
      ],
    },
  ],
};

export const podioFilterAppStreamOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'title',
      listItems: [
        {
          key: 'activity',
          label: 'Activity',
          labelKey: 'id',
          listItems: [
            { key: 'activity_type', label: 'Activity Type' },
            {
              key: 'created_by',
              label: 'Created By',
              children: userFields,
            },
            { key: 'created_on', label: 'Created', format: 'datetime' },
            {
              key: 'created_via',
              label: 'Created Via',
              children: createdViaFields,
            },
            { key: 'data', label: 'Data' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'type', label: 'Type' },
          ],
        },
        {
          key: 'app',
          label: 'App',
          children: appFields,
        },
        { key: 'comments', label: 'Comments' },
        {
          key: 'comments_allowed',
          label: 'Comments Allowed',
          format: 'boolean',
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'created_via',
          label: 'Created Via',
          children: createdViaFields,
        },
        { key: 'data', label: 'Data' },
        { key: 'files', label: 'Files' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_update_on', label: 'Last Updated', format: 'datetime' },
        { key: 'link', label: 'Link', format: 'url' },
        {
          key: 'org',
          label: 'Organization',
          children: organizationFields,
        },
        { key: 'rights', label: 'Rights' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        {
          key: 'user_ratings',
          label: 'User Ratings',
          children: [{ key: 'like', label: 'Like' }],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioFilterItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'filtered', label: 'Filtered', format: 'number' },
    {
      key: 'items',
      label: 'Items',
      labelKey: 'title',
      listItems: itemListFields,
    },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const podioFindReferenceableItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'title',
      listItems: itemPreviewFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'action_id', label: 'Action ID', format: 'number' },
    { key: 'comments', label: 'Comments' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    {
      key: 'data',
      label: 'Data',
      children: appBasicFields,
    },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'text', label: 'Text' },
    { key: 'type', label: 'Type' },
  ],
};

export const podioGetAppOutputSchema: OutputSchema = {
  fields: [
    { key: 'app_id', label: 'App ID', format: 'number' },
    {
      key: 'config',
      label: 'Configuration',
      children: appFullConfigFields,
    },
    { key: 'current_revision', label: 'Current Revision', format: 'number' },
    { key: 'default_view_id', label: 'Default View ID', format: 'number' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: [
        {
          key: 'config',
          label: 'Configuration',
          children: [
            { key: 'default_value', label: 'Default Value' },
            { key: 'delta', label: 'Delta', format: 'number' },
            { key: 'description', label: 'Description' },
            { key: 'hidden', label: 'Hidden', format: 'boolean' },
            {
              key: 'hidden_create_view_edit',
              label: 'Hidden In Create And Edit',
              format: 'boolean',
            },
            { key: 'label', label: 'Label' },
            { key: 'mapping', label: 'Mapping' },
            { key: 'read_only', label: 'Read Only', format: 'boolean' },
            { key: 'required', label: 'Required', format: 'boolean' },
            {
              key: 'settings',
              label: 'Settings',
              children: [
                { key: 'size', label: 'Size' },
                { key: 'format', label: 'Format' },
                {
                  key: 'options',
                  label: 'Options',
                  labelKey: 'id',
                  listItems: categoryOptionFields,
                },
                { key: 'multiple', label: 'Multiple', format: 'boolean' },
                { key: 'display', label: 'Display' },
                { key: 'calendar', label: 'Calendar', format: 'boolean' },
                { key: 'end', label: 'End' },
                { key: 'time', label: 'Time' },
                { key: 'color', label: 'Color' },
                { key: 'decimals', label: 'Decimals' },
              ],
            },
            { key: 'unique', label: 'Unique', format: 'boolean' },
            { key: 'visible', label: 'Visible', format: 'boolean' },
          ],
        },
        { key: 'external_id', label: 'External ID' },
        { key: 'field_id', label: 'Field ID', format: 'number' },
        { key: 'label', label: 'Label' },
        { key: 'revision_from', label: 'Revision From', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'integration', label: 'Integration' },
    { key: 'is_default', label: 'Default', format: 'boolean' },
    {
      key: 'item_accounting_info',
      label: 'Item Usage',
      children: usageQuotaFields,
    },
    {
      key: 'layouts',
      label: 'Layouts',
      children: layoutBadgesFields,
    },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'link_add', label: 'Add Link', format: 'url' },
    { key: 'original', label: 'Original' },
    { key: 'original_revision', label: 'Original Revision' },
    {
      key: 'owner',
      label: 'Owner',
      children: profileFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'space_id', label: 'Space ID', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    {
      key: 'task_accounting_info',
      label: 'Task Usage',
      children: userUsageQuotaFields,
    },
    { key: 'url_add', label: 'Add URL', format: 'url' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'url_label', label: 'URL Label' },
    {
      key: 'workflow_accounting_info',
      label: 'Workflow Usage',
      children: usageQuotaFields,
    },
    { key: 'mailbox', label: 'Mailbox' },
  ],
};

export const podioGetAppCalendarOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'title',
      listItems: calendarEventFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetAppDependenciesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'apps',
      label: 'Apps',
      labelKey: 'name',
      listItems: appFields,
    },
    { key: 'dependencies', label: 'Dependencies', dynamicKey: true },
  ],
};

export const podioGetAppEmailConfigurationOutputSchema: OutputSchema = {
  fields: [
    { key: 'attachments', label: 'Attachments', format: 'boolean' },
    { key: 'field_options', label: 'Field Options', dynamicKey: true },
    { key: 'mappings', label: 'Mappings', dynamicKey: true },
  ],
};

export const podioGetAppFeaturesOutputSchema: OutputSchema = {
  fields: [
    { key: 'features', label: 'Features' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetAppFieldOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'config',
      label: 'Configuration',
      children: fieldConfigFields,
    },
    { key: 'external_id', label: 'External ID' },
    { key: 'field_id', label: 'Field ID', format: 'number' },
    { key: 'label', label: 'Label' },
    { key: 'revision_from', label: 'Revision From', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'type', label: 'Type' },
  ],
};

export const podioGetAppInverseDependenciesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'dependent_apps',
      label: 'Dependent Apps',
      listItems: [
        { key: 'app_id', label: 'App ID', format: 'number' },
        { key: 'field_id', label: 'Field ID', format: 'number' },
      ],
    },
  ],
};

export const podioGetAppStreamOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'title',
      listItems: [
        {
          key: 'activity_groups',
          label: 'Activity Groups',
          listItems: [
            {
              key: 'activities',
              label: 'Activities',
              listItems: [
                { key: 'created_on', label: 'Created', format: 'datetime' },
                {
                  key: 'created_via',
                  label: 'Created Via',
                  children: createdViaFields,
                },
                { key: 'data', label: 'Data' },
                {
                  key: 'data_ref',
                  label: 'Data Reference',
                  children: objectRefFields,
                },
                { key: 'event_id', label: 'Event ID', format: 'number' },
                { key: 'type', label: 'Type' },
              ],
            },
            {
              key: 'created_by',
              label: 'Created By',
              children: userFields,
            },
            { key: 'created_on', label: 'Created', format: 'datetime' },
            {
              key: 'created_via',
              label: 'Created Via',
              children: createdViaFields,
            },
            { key: 'group_id', label: 'Group ID', format: 'number' },
            { key: 'kind', label: 'Kind' },
          ],
        },
        {
          key: 'app',
          label: 'App',
          children: appFields,
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'data', label: 'Data' },
        { key: 'files', label: 'Files' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'is_liked', label: 'Liked', format: 'boolean' },
        { key: 'like_count', label: 'Like Count', format: 'number' },
        { key: 'link', label: 'Link', format: 'url' },
        {
          key: 'org',
          label: 'Organization',
          children: organizationFields,
        },
        { key: 'rights', label: 'Rights' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
        {
          key: 'subscribed_count',
          label: 'Subscribed Count',
          format: 'number',
        },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetAppValuesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: [
        { key: 'field_id', label: 'Field ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'label', label: 'Label' },
        {
          key: 'values',
          label: 'Values',
          children: valueRangeFields,
        },
      ],
    },
    {
      key: 'created_bys',
      label: 'Created Bys',
      labelKey: 'name',
      listItems: userFields,
    },
    {
      key: 'created_vias',
      label: 'Created Vias',
      labelKey: 'name',
      listItems: createdViaFields,
    },
    { key: 'tags', label: 'Tags' },
  ],
};

export const podioGetAppVotingsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'votings',
      label: 'Votings',
      listItems: votingWithAnswersFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetAvailableSeatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'employee', label: 'Employee', format: 'number' },
    { key: 'external', label: 'External', format: 'number' },
  ],
};

export const podioGetAvailableSpacesOutputSchema: OutputSchema = {
  fields: [
    { key: 'spaces', label: 'Spaces' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetBadgeOfItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'guest', label: 'Guest', format: 'boolean' },
    {
      key: 'item',
      label: 'Item',
      children: [
        {
          key: 'app',
          label: 'App',
          children: [
            { key: 'app_id', label: 'App ID', format: 'number' },
            {
              key: 'config',
              label: 'Configuration',
              children: appIconConfigFields,
            },
            {
              key: 'current_revision',
              label: 'Current Revision',
              format: 'number',
            },
            { key: 'default_view_id', label: 'Default View ID' },
            { key: 'icon', label: 'Icon' },
            { key: 'icon_id', label: 'Icon ID', format: 'number' },
            { key: 'is_default', label: 'Default', format: 'boolean' },
            {
              key: 'item_accounting_info',
              label: 'Item Usage',
              children: usageQuotaFields,
            },
            { key: 'item_name', label: 'Item Name' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'link_add', label: 'Add Link', format: 'url' },
            { key: 'name', label: 'Name' },
            { key: 'rights', label: 'Rights' },
            { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
            { key: 'space_id', label: 'Space ID', format: 'number' },
            { key: 'status', label: 'Status' },
            {
              key: 'task_accounting_info',
              label: 'Task Usage',
              children: userUsageQuotaFields,
            },
            { key: 'url_add', label: 'Add URL', format: 'url' },
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'url_label', label: 'URL Label' },
            {
              key: 'workflow_accounting_info',
              label: 'Workflow Usage',
              children: usageQuotaFields,
            },
          ],
        },
        { key: 'app_item_id', label: 'App Item ID', format: 'number' },
        { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'created_via',
          label: 'Created Via',
          children: createdViaFields,
        },
        {
          key: 'email_item_comment_app',
          label: 'Email Item Comment App',
          children: emailContactFields,
        },
        {
          key: 'email_item_comment_user',
          label: 'Email Item Comment User',
          children: emailContactFields,
        },
        { key: 'file_count', label: 'File Count', format: 'number' },
        { key: 'item_id', label: 'Item ID', format: 'number' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'participants', label: 'Participants' },
        { key: 'revision', label: 'Revision', format: 'number' },
        {
          key: 'current_revision',
          label: 'Current Revision',
          children: revisionFields,
        },
        {
          key: 'initial_revision',
          label: 'Initial Revision',
          children: revisionFields,
        },
        { key: 'rights', label: 'Rights' },
        {
          key: 'sharefile_vault_folder_id',
          label: 'ShareFile Vault Folder ID',
        },
        { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'tags', label: 'Tags' },
        { key: 'title', label: 'Title' },
        { key: 'votes', label: 'Votes' },
      ],
    },
    {
      key: 'layout',
      label: 'Layout',
      children: layoutFields,
    },
    {
      key: 'layout_item_field_values',
      label: 'Layout Item Field Values',
      children: [
        {
          key: 'header',
          label: 'Header',
          children: [
            {
              key: 'config',
              label: 'Configuration',
              children: fieldConfigDeepFields,
            },
            { key: 'external_id', label: 'External ID' },
            { key: 'field_id', label: 'Field ID', format: 'number' },
            { key: 'label', label: 'Label' },
            { key: 'revision_from', label: 'Revision From', format: 'number' },
            { key: 'status', label: 'Status' },
            { key: 'type', label: 'Type' },
            {
              key: 'values',
              label: 'Values',
              listItems: dateRangeFields,
            },
            { key: 'read_only', label: 'Read Only', format: 'boolean' },
          ],
        },
        {
          key: 'content',
          label: 'Content',
          children: fieldDefinitionNestedFields,
        },
        {
          key: 'details_1',
          label: 'Details 1',
          children: [
            {
              key: 'config',
              label: 'Configuration',
              children: [
                { key: 'default_value', label: 'Default Value' },
                { key: 'delta', label: 'Delta', format: 'number' },
                { key: 'description', label: 'Description' },
                { key: 'hidden', label: 'Hidden', format: 'boolean' },
                {
                  key: 'hidden_create_view_edit',
                  label: 'Hidden In Create And Edit',
                  format: 'boolean',
                },
                { key: 'label', label: 'Label' },
                { key: 'mapping', label: 'Mapping' },
                { key: 'read_only', label: 'Read Only', format: 'boolean' },
                { key: 'required', label: 'Required', format: 'boolean' },
                {
                  key: 'settings',
                  label: 'Settings',
                  children: [
                    {
                      key: 'options',
                      label: 'Options',
                      labelKey: 'id',
                      listItems: categoryOptionFields,
                    },
                    { key: 'multiple', label: 'Multiple', format: 'boolean' },
                    { key: 'display', label: 'Display' },
                  ],
                },
                { key: 'unique', label: 'Unique', format: 'boolean' },
                { key: 'visible', label: 'Visible', format: 'boolean' },
              ],
            },
            { key: 'external_id', label: 'External ID' },
            { key: 'field_id', label: 'Field ID', format: 'number' },
            { key: 'label', label: 'Label' },
            { key: 'revision_from', label: 'Revision From', format: 'number' },
            { key: 'status', label: 'Status' },
            { key: 'type', label: 'Type' },
            {
              key: 'values',
              label: 'Values',
              listItems: [
                {
                  key: 'value',
                  label: 'Value',
                  children: categoryOptionFields,
                },
              ],
            },
            { key: 'read_only', label: 'Read Only', format: 'boolean' },
          ],
        },
        {
          key: 'details_2',
          label: 'Details 2',
          children: [
            {
              key: 'config',
              label: 'Configuration',
              children: [
                { key: 'default_value', label: 'Default Value' },
                { key: 'delta', label: 'Delta', format: 'number' },
                { key: 'description', label: 'Description' },
                { key: 'hidden', label: 'Hidden', format: 'boolean' },
                {
                  key: 'hidden_create_view_edit',
                  label: 'Hidden In Create And Edit',
                  format: 'boolean',
                },
                { key: 'label', label: 'Label' },
                { key: 'mapping', label: 'Mapping' },
                { key: 'read_only', label: 'Read Only', format: 'boolean' },
                { key: 'required', label: 'Required', format: 'boolean' },
                {
                  key: 'settings',
                  label: 'Settings',
                  children: [{ key: 'decimals', label: 'Decimals' }],
                },
                { key: 'unique', label: 'Unique', format: 'boolean' },
                { key: 'visible', label: 'Visible', format: 'boolean' },
              ],
            },
            { key: 'external_id', label: 'External ID' },
            { key: 'field_id', label: 'Field ID', format: 'number' },
            { key: 'label', label: 'Label' },
            { key: 'revision_from', label: 'Revision From', format: 'number' },
            { key: 'status', label: 'Status' },
            { key: 'type', label: 'Type' },
            {
              key: 'values',
              label: 'Values',
              listItems: [{ key: 'value', label: 'Value' }],
            },
            { key: 'read_only', label: 'Read Only', format: 'boolean' },
          ],
        },
      ],
    },
  ],
};

export const podioGetBatchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'app',
      label: 'App',
      children: appBasicFields,
    },
    { key: 'batch_id', label: 'Batch ID', format: 'number' },
    { key: 'completed', label: 'Completed', format: 'number' },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'ended_on', label: 'Ended', format: 'datetime' },
    { key: 'failed', label: 'Failed', format: 'number' },
    { key: 'file', label: 'File' },
    { key: 'name', label: 'Name' },
    { key: 'plugin', label: 'Plugin' },
    {
      key: 'ref',
      label: 'Reference',
      children: referenceBasicFields,
    },
    { key: 'skipped', label: 'Skipped', format: 'number' },
    {
      key: 'space',
      label: 'Space',
      children: spaceFields,
    },
    { key: 'started_on', label: 'Started', format: 'datetime' },
    { key: 'status', label: 'Status' },
  ],
};

export const podioGetBatchesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'batches',
      label: 'Batches',
      labelKey: 'name',
      listItems: [
        {
          key: 'app',
          label: 'App',
          children: appBasicFields,
        },
        { key: 'batch_id', label: 'Batch ID', format: 'number' },
        { key: 'completed', label: 'Completed', format: 'number' },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'ended_on', label: 'Ended', format: 'datetime' },
        { key: 'failed', label: 'Failed', format: 'number' },
        {
          key: 'file',
          label: 'File',
          children: fileBasicFields,
        },
        { key: 'name', label: 'Name' },
        { key: 'plugin', label: 'Plugin' },
        {
          key: 'ref',
          label: 'Reference',
          children: referenceBasicFields,
        },
        { key: 'skipped', label: 'Skipped', format: 'number' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'started_on', label: 'Started', format: 'datetime' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetCalendarExportsOutputSchema: OutputSchema = {
  fields: [
    { key: 'exports', label: 'Exports' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetCalendarSummaryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'today',
      label: 'Today',
      children: eventListFields,
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      children: eventListFields,
    },
  ],
};

export const podioGetCommentOutputSchema: OutputSchema = {
  fields: commentFields,
};

export const podioGetCommentRevisionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'revisions',
      label: 'Revisions',
      listItems: [
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'embed', label: 'Embed' },
        { key: 'embed_file', label: 'Embed File' },
        { key: 'rich_value', label: 'Rich Text Value' },
        { key: 'value', label: 'Value' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetContactTotalsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'user',
      label: 'User',
      children: [
        { key: 'count', label: 'Count', format: 'number' },
        {
          key: 'orgs',
          label: 'Organizations',
          listItems: [
            { key: 'count', label: 'Count', format: 'number' },
            {
              key: 'org',
              label: 'Organization',
              children: organizationBasicFields,
            },
            {
              key: 'spaces',
              label: 'Spaces',
              listItems: [
                { key: 'count', label: 'Count', format: 'number' },
                {
                  key: 'space',
                  label: 'Space',
                  children: spaceFields,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const podioGetContactsByIdOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'name',
      listItems: contactFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetConversationOutputSchema: OutputSchema = {
  fields: [
    { key: 'conversation_id', label: 'Conversation ID', format: 'number' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'excerpt', label: 'Excerpt' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'live', label: 'Live' },
    { key: 'messages', label: 'Messages' },
    { key: 'participants_full', label: 'Participants Full' },
    {
      key: 'participants',
      label: 'Participants',
      labelKey: 'name',
      listItems: profileFields,
    },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'ref', label: 'Reference' },
    { key: 'starred', label: 'Starred', format: 'boolean' },
    { key: 'subject', label: 'Subject' },
    { key: 'type', label: 'Type' },
    { key: 'unread', label: 'Unread', format: 'boolean' },
    { key: 'unread_count', label: 'Unread Count', format: 'number' },
  ],
};

export const podioGetConversationEventOutputSchema: OutputSchema = {
  fields: conversationEventFields,
};

export const podioGetConversationEventsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      listItems: [
        { key: 'action', label: 'Action' },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'created_via',
          label: 'Created Via',
          children: createdViaFields,
        },
        { key: 'data', label: 'Data' },
        { key: 'event_id', label: 'Event ID', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetConversationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'conversations', label: 'Conversations' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetConversationsOnObjectOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'conversations',
      label: 'Conversations',
      labelKey: 'subject',
      listItems: [
        { key: 'conversation_id', label: 'Conversation ID', format: 'number' },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'excerpt', label: 'Excerpt' },
        { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'live', label: 'Live' },
        { key: 'messages', label: 'Messages' },
        { key: 'participants_full', label: 'Participants Full' },
        {
          key: 'participants',
          label: 'Participants',
          labelKey: 'name',
          listItems: profileFields,
        },
        {
          key: 'presence',
          label: 'Presence',
          children: presenceFields,
        },
        {
          key: 'push',
          label: 'Push',
          children: pushFields,
        },
        { key: 'ref', label: 'Reference' },
        { key: 'subject', label: 'Subject' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetEmailContactForReferenceOutputSchema: OutputSchema = {
  fields: emailContactFields,
};

export const podioGetEmailContactForReferenceAsVcardOutputSchema: OutputSchema =
  {
    fields: [{ key: 'vcard', label: 'vCard' }],
  };

export const podioGetEmailGroupsOutputSchema: OutputSchema = {
  fields: [
    { key: 'bulletin', label: 'Bulletin', format: 'boolean' },
    { key: 'digest', label: 'Digest', format: 'boolean' },
    { key: 'meeting_update', label: 'Meeting Update', format: 'boolean' },
    {
      key: 'meeting_update_as_organizer',
      label: 'Meeting Update As Organizer',
      format: 'boolean',
    },
    { key: 'message', label: 'Message', format: 'boolean' },
    { key: 'push_notification', label: 'Push Notification', format: 'boolean' },
    {
      key: 'push_notification_browser',
      label: 'Push Notification Browser',
      format: 'boolean',
    },
    {
      key: 'push_notification_sound',
      label: 'Push Notification Sound',
      format: 'boolean',
    },
    { key: 'reference', label: 'Reference', format: 'boolean' },
    { key: 'reminder', label: 'Reminder', format: 'boolean' },
    { key: 'space', label: 'Space', format: 'boolean' },
    { key: 'subscription', label: 'Subscription', format: 'boolean' },
    { key: 'user', label: 'User', format: 'boolean' },
  ],
};

export const podioGetFieldRangesOutputSchema: OutputSchema = {
  fields: valueRangeFields,
};

export const podioGetFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'description', label: 'Description' },
    { key: 'external_file_id', label: 'External File ID' },
    { key: 'file_id', label: 'File ID', format: 'number' },
    { key: 'hosted_by', label: 'Hosted By' },
    { key: 'hosted_by_humanized_name', label: 'Hosted By Name' },
    { key: 'is_liked', label: 'Liked' },
    { key: 'like_count', label: 'Like Count' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'link_target', label: 'Link Target' },
    { key: 'mimetype', label: 'MIME Type' },
    { key: 'name', label: 'Name' },
    { key: 'perma_link', label: 'Permalink' },
    { key: 'presence', label: 'Presence' },
    { key: 'push', label: 'Push' },
    { key: 'replaces', label: 'Replaces' },
    { key: 'rights', label: 'Rights' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'subscribed', label: 'Subscribed' },
    { key: 'subscribed_count', label: 'Subscribed Count' },
    { key: 'thumbnail_link', label: 'Thumbnail Link' },
    { key: 'uuid_link', label: 'UUID Link' },
  ],
};

export const podioGetFilesOutputSchema: OutputSchema = {
  fields: [
    { key: 'files', label: 'Files' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetFlaggedConversationCountsOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Value', format: 'number' }],
};

export const podioGetFlowAttributesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'attributes',
      label: 'Attributes',
      labelKey: 'label',
      listItems: [
        { key: 'attribute_id', label: 'Attribute ID' },
        { key: 'label', label: 'Label' },
        { key: 'type', label: 'Type' },
        { key: 'field_id', label: 'Field ID', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetFlowContextOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'attributes',
      label: 'Context Attributes',
      value: '',
      dynamicKey: true,
      labelKey: 'label',
      children: [
        { key: 'attribute_id', label: 'Attribute ID' },
        { key: 'field_id', label: 'Field ID', format: 'number' },
        { key: 'label', label: 'Label' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
};

export const podioGetFlowEffectAttributesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'attributes',
      label: 'Attributes',
      labelKey: 'label',
      listItems: [
        { key: 'attribute_id', label: 'Attribute ID' },
        { key: 'label', label: 'Label' },
        { key: 'nullable', label: 'Nullable', format: 'boolean' },
        { key: 'required', label: 'Required', format: 'boolean' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetGlobalStreamOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'title',
      listItems: [
        {
          key: 'activity_groups',
          label: 'Activity Groups',
          listItems: [
            {
              key: 'activities',
              label: 'Activities',
              listItems: [
                { key: 'created_on', label: 'Created', format: 'datetime' },
                {
                  key: 'created_via',
                  label: 'Created Via',
                  children: createdViaFields,
                },
                { key: 'data', label: 'Data' },
                {
                  key: 'data_ref',
                  label: 'Data Reference',
                  children: objectRefFields,
                },
                { key: 'event_id', label: 'Event ID', format: 'number' },
                { key: 'type', label: 'Type' },
              ],
            },
            {
              key: 'created_by',
              label: 'Created By',
              children: userFields,
            },
            { key: 'created_on', label: 'Created', format: 'datetime' },
            {
              key: 'created_via',
              label: 'Created Via',
              children: createdViaFields,
            },
            { key: 'group_id', label: 'Group ID', format: 'number' },
            { key: 'kind', label: 'Kind' },
          ],
        },
        {
          key: 'app',
          label: 'App',
          children: appFields,
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'data', label: 'Data' },
        { key: 'files', label: 'Files' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'is_liked', label: 'Liked', format: 'boolean' },
        { key: 'like_count', label: 'Like Count', format: 'number' },
        { key: 'link', label: 'Link', format: 'url' },
        {
          key: 'org',
          label: 'Organization',
          children: organizationFields,
        },
        { key: 'rights', label: 'Rights' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
        {
          key: 'subscribed_count',
          label: 'Subscribed Count',
          format: 'number',
        },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetIconSuggestionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'icons', label: 'Icons' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetImportFileInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'row_count', label: 'Row Count', format: 'number' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const podioGetInactiveSubscriptionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      children: [
        { key: 'apps', label: 'Apps' },
        {
          key: 'spaces',
          label: 'Spaces',
          labelKey: 'name',
          listItems: spaceFields,
        },
      ],
    },
  ],
};

export const podioGetInboxNewCountOutputSchema: OutputSchema = {
  fields: [{ key: 'new', label: 'New', format: 'number' }],
};

export const podioGetItemOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'app',
      label: 'App',
      children: appFields,
    },
    { key: 'app_item_id', label: 'App Item ID', format: 'number' },
    { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
    { key: 'comments', label: 'Comments' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'external_id', label: 'External ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: fieldDefinitionDeepFields,
    },
    {
      key: 'files',
      label: 'Files',
      labelKey: 'name',
      listItems: fileDetailFields,
    },
    { key: 'invite', label: 'Invite' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'item_id', label: 'Item ID', format: 'number' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'linked_account_data', label: 'Linked Account Data' },
    { key: 'linked_account_id', label: 'Linked Account ID' },
    { key: 'participants', label: 'Participants' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'priority', label: 'Priority', format: 'number' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    {
      key: 'ratings',
      label: 'Ratings',
      children: [
        {
          key: 'like',
          label: 'Like',
          children: ratingFields,
        },
      ],
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'refs', label: 'References' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'revision', label: 'Revision', format: 'number' },
    {
      key: 'current_revision',
      label: 'Current Revision',
      children: revisionFields,
    },
    {
      key: 'initial_revision',
      label: 'Initial Revision',
      children: revisionFields,
    },
    {
      key: 'revisions',
      label: 'Revisions',
      listItems: revisionFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'tags', label: 'Tags' },
    { key: 'title', label: 'Title' },
    {
      key: 'user_ratings',
      label: 'User Ratings',
      children: [{ key: 'like', label: 'Like' }],
    },
  ],
};

export const podioGetItemByAppItemIdOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'app',
      label: 'App',
      children: appFields,
    },
    { key: 'app_item_id', label: 'App Item ID', format: 'number' },
    { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
    { key: 'comments', label: 'Comments' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'external_id', label: 'External ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: fieldDefinitionDeepFields,
    },
    { key: 'files', label: 'Files' },
    { key: 'invite', label: 'Invite' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'item_id', label: 'Item ID', format: 'number' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'linked_account_data', label: 'Linked Account Data' },
    { key: 'linked_account_id', label: 'Linked Account ID' },
    { key: 'participants', label: 'Participants' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'priority', label: 'Priority', format: 'number' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    {
      key: 'ratings',
      label: 'Ratings',
      children: [
        {
          key: 'like',
          label: 'Like',
          children: ratingFields,
        },
      ],
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'refs', label: 'References' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'revision', label: 'Revision', format: 'number' },
    {
      key: 'current_revision',
      label: 'Current Revision',
      children: revisionFields,
    },
    {
      key: 'initial_revision',
      label: 'Initial Revision',
      children: revisionFields,
    },
    {
      key: 'revisions',
      label: 'Revisions',
      listItems: revisionFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'tags', label: 'Tags' },
    { key: 'title', label: 'Title' },
    {
      key: 'user_ratings',
      label: 'User Ratings',
      children: [{ key: 'like', label: 'Like' }],
    },
  ],
};

export const podioGetItemByExternalIdOutputSchema: OutputSchema = {
  fields: itemListFields,
};

export const podioGetItemCloneOutputSchema: OutputSchema = {
  fields: [
    { key: 'files', label: 'Files' },
    { key: 'tags', label: 'Tags' },
    { key: 'values', label: 'Values', dynamicKey: true },
  ],
};

export const podioGetItemFieldCalendarAsIcalOutputSchema: OutputSchema = {
  fields: [{ key: 'ical', label: 'iCalendar' }],
};

export const podioGetItemFieldValuesOutputSchema: OutputSchema = {
  fields: [{ key: 'values', label: 'Values' }],
};

export const podioGetItemPreviewForFieldReferenceOutputSchema: OutputSchema = {
  fields: itemPreviewFields,
};

export const podioGetItemReferencesOutputSchema: OutputSchema = {
  fields: [
    { key: 'references', label: 'References' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetItemRevisionOutputSchema: OutputSchema = {
  fields: revisionFields,
};

export const podioGetItemRevisionDifferenceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'changes',
      label: 'Changes',
      labelKey: 'label',
      listItems: [
        { key: 'field_id', label: 'Field ID', format: 'number' },
        { key: 'external_id', label: 'External ID' },
        { key: 'type', label: 'Type' },
        { key: 'label', label: 'Label' },
        { key: 'config', label: 'Configuration' },
        { key: 'from', label: 'From' },
        { key: 'to', label: 'To' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetItemRevisionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'revisions',
      label: 'Revisions',
      listItems: revisionFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetItemValuesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: fieldDefinitionDeepFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetItemVotingResultsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      value: '',
      dynamicKey: true,
      children: votingResultFields,
    },
  ],
};

export const podioGetItemsAsXlsxOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'file_name', label: 'File Name' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
  ],
};

export const podioGetLayoutOutputSchema: OutputSchema = {
  fields: [
    { key: 'app_id', label: 'App ID', format: 'number' },
    { key: 'default', label: 'Default', format: 'boolean' },
    {
      key: 'fields',
      label: 'Fields',
      children: [
        {
          key: 'header',
          label: 'Header',
          children: layoutFieldRefFields,
        },
        {
          key: 'content',
          label: 'Content',
          children: layoutFieldRefFields,
        },
        {
          key: 'details_1',
          label: 'Details 1',
          children: layoutFieldRefFields,
        },
        {
          key: 'details_2',
          label: 'Details 2',
          children: layoutFieldRefFields,
        },
        {
          key: 'details_3',
          label: 'Details 3',
          children: layoutFieldRefFields,
        },
        {
          key: 'footer_1',
          label: 'Footer 1',
          children: layoutFieldKeyFields,
        },
        {
          key: 'footer_2',
          label: 'Footer 2',
          children: layoutFieldKeyFields,
        },
        {
          key: 'footer_3',
          label: 'Footer 3',
          children: layoutFieldKeyFields,
        },
      ],
    },
    { key: 'type', label: 'Type' },
  ],
};

export const podioGetLikeCountOutputSchema: OutputSchema = {
  fields: [{ key: 'like_count', label: 'Like Count', format: 'number' }],
};

export const podioGetLinkedAccountContactOutputSchema: OutputSchema = {
  fields: linkedContactFields,
};

export const podioGetLinkedAccountContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'name',
      listItems: linkedContactFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetLinkedAccountFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'files',
      label: 'Files',
      labelKey: 'name',
      listItems: [
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'edit_link', label: 'Edit Link' },
        { key: 'external_file_id', label: 'External File ID' },
        { key: 'link', label: 'Link' },
        { key: 'mimetype', label: 'MIME Type' },
        { key: 'name', label: 'Name' },
        { key: 'preview_link', label: 'Preview Link' },
        { key: 'shareable', label: 'Shareable', format: 'boolean' },
        { key: 'updated_on', label: 'Updated', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetLinkedAccountsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'linkedAccounts',
      label: 'Linked Accounts',
      labelKey: 'label',
      listItems: [
        {
          key: 'capability_names',
          label: 'Capability Names',
          children: [
            { key: 'contacts', label: 'Contacts' },
            { key: 'addressbook', label: 'Addressbook' },
            { key: 'files', label: 'Files' },
            { key: 'calendar', label: 'Calendar' },
          ],
        },
        { key: 'label', label: 'Label', format: 'email' },
        {
          key: 'linked_account_id',
          label: 'Linked Account ID',
          format: 'number',
        },
        {
          key: 'options',
          label: 'Options',
          children: [
            {
              key: 'action_install',
              label: 'Action Install',
              format: 'boolean',
            },
            { key: 'action_share', label: 'Action Share', format: 'boolean' },
          ],
        },
        { key: 'provider', label: 'Provider' },
        { key: 'provider_humanized_name', label: 'Provider Humanized Name' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetMeetingUrlOutputSchema: OutputSchema = {
  fields: [{ key: 'url', label: 'URL' }],
};

export const podioGetNotificationOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'context',
      label: 'Context',
      children: [
        { key: 'comment_count', label: 'Comment Count' },
        {
          key: 'data',
          label: 'Data',
          children: [
            {
              key: 'app',
              label: 'App',
              children: [
                { key: 'app_id', label: 'App ID', format: 'number' },
                {
                  key: 'config',
                  label: 'Configuration',
                  children: appConfigFields,
                },
                {
                  key: 'current_revision',
                  label: 'Current Revision',
                  format: 'number',
                },
                {
                  key: 'default_view_id',
                  label: 'Default View ID',
                  format: 'number',
                },
                { key: 'is_default', label: 'Default', format: 'boolean' },
                {
                  key: 'item_accounting_info',
                  label: 'Item Usage',
                  children: usageQuotaFields,
                },
                { key: 'link', label: 'Link', format: 'url' },
                { key: 'link_add', label: 'Add Link', format: 'url' },
                { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
                { key: 'space_id', label: 'Space ID', format: 'number' },
                { key: 'status', label: 'Status' },
                {
                  key: 'task_accounting_info',
                  label: 'Task Usage',
                  children: userUsageQuotaFields,
                },
                { key: 'url_add', label: 'Add URL', format: 'url' },
                { key: 'url', label: 'URL', format: 'url' },
                { key: 'url_label', label: 'URL Label' },
                {
                  key: 'workflow_accounting_info',
                  label: 'Workflow Usage',
                  children: usageQuotaFields,
                },
              ],
            },
            { key: 'batch_id', label: 'Batch ID', format: 'number' },
            { key: 'completed', label: 'Completed', format: 'number' },
            { key: 'created_on', label: 'Created', format: 'datetime' },
            { key: 'ended_on', label: 'Ended', format: 'datetime' },
            { key: 'failed', label: 'Failed', format: 'number' },
            {
              key: 'file',
              label: 'File',
              children: fileBasicFields,
            },
            { key: 'name', label: 'Name' },
            { key: 'plugin', label: 'Plugin' },
            { key: 'skipped', label: 'Skipped', format: 'number' },
            { key: 'started_on', label: 'Started', format: 'datetime' },
            { key: 'status', label: 'Status' },
          ],
        },
        { key: 'link', label: 'Link', format: 'url' },
        {
          key: 'org',
          label: 'Organization',
          children: organizationBasicFields,
        },
        {
          key: 'ref',
          label: 'Reference',
          children: objectRefFields,
        },
        { key: 'rights', label: 'Rights' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'title', label: 'Title' },
      ],
    },
    {
      key: 'notifications',
      label: 'Notifications',
      listItems: notificationFields,
    },
  ],
};

export const podioGetNotificationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'notifications',
      label: 'Notifications',
      listItems: [
        {
          key: 'context',
          label: 'Context',
          children: [
            { key: 'comment_count', label: 'Comment Count' },
            {
              key: 'data',
              label: 'Data',
              children: [
                {
                  key: 'app',
                  label: 'App',
                  children: appBasicFields,
                },
                { key: 'batch_id', label: 'Batch ID', format: 'number' },
                { key: 'completed', label: 'Completed', format: 'number' },
                { key: 'created_on', label: 'Created', format: 'datetime' },
                { key: 'ended_on', label: 'Ended', format: 'datetime' },
                { key: 'failed', label: 'Failed', format: 'number' },
                {
                  key: 'file',
                  label: 'File',
                  children: fileBasicFields,
                },
                { key: 'name', label: 'Name' },
                { key: 'plugin', label: 'Plugin' },
                { key: 'skipped', label: 'Skipped', format: 'number' },
                { key: 'started_on', label: 'Started', format: 'datetime' },
                { key: 'status', label: 'Status' },
              ],
            },
            { key: 'link', label: 'Link', format: 'url' },
            {
              key: 'org',
              label: 'Organization',
              children: organizationBasicFields,
            },
            {
              key: 'ref',
              label: 'Reference',
              children: objectRefFields,
            },
            { key: 'rights', label: 'Rights' },
            {
              key: 'space',
              label: 'Space',
              children: spaceFields,
            },
            { key: 'title', label: 'Title' },
          ],
        },
        {
          key: 'notifications',
          label: 'Notifications',
          listItems: notificationFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetObjectEventGroupByDataReferenceOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'activities',
        label: 'Activities',
        listItems: [
          { key: 'created_on', label: 'Created', format: 'datetime' },
          {
            key: 'created_via',
            label: 'Created Via',
            children: createdViaFields,
          },
          { key: 'data', label: 'Data' },
          {
            key: 'data_ref',
            label: 'Data Reference',
            children: objectRefFields,
          },
          { key: 'event_id', label: 'Event ID', format: 'number' },
          { key: 'type', label: 'Type' },
        ],
      },
      {
        key: 'created_by',
        label: 'Created By',
        children: userFields,
      },
      { key: 'created_on', label: 'Created', format: 'datetime' },
      {
        key: 'created_via',
        label: 'Created Via',
        children: createdViaFields,
      },
      { key: 'group_id', label: 'Group ID', format: 'number' },
      { key: 'kind', label: 'Kind' },
    ],
  };

export const podioGetObjectEventGroupByEventIdOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'activities',
      label: 'Activities',
      listItems: [
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'created_via',
          label: 'Created Via',
          children: createdViaFields,
        },
        { key: 'data', label: 'Data' },
        {
          key: 'data_ref',
          label: 'Data Reference',
          children: objectRefFields,
        },
        { key: 'event_id', label: 'Event ID', format: 'number' },
        { key: 'type', label: 'Type' },
      ],
    },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'group_id', label: 'Group ID', format: 'number' },
    { key: 'kind', label: 'Kind' },
  ],
};

export const podioGetObjectEventGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      listItems: [
        {
          key: 'activities',
          label: 'Activities',
          listItems: [
            { key: 'created_on', label: 'Created', format: 'datetime' },
            {
              key: 'created_via',
              label: 'Created Via',
              children: createdViaFields,
            },
            { key: 'data', label: 'Data' },
            {
              key: 'data_ref',
              label: 'Data Reference',
              children: objectRefFields,
            },
            { key: 'event_id', label: 'Event ID', format: 'number' },
            { key: 'type', label: 'Type' },
          ],
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'created_via',
          label: 'Created Via',
          children: createdViaFields,
        },
        { key: 'group_id', label: 'Group ID', format: 'number' },
        { key: 'kind', label: 'Kind' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetObjectReferenceOutputSchema: OutputSchema = {
  fields: [
    { key: 'accessor_count', label: 'Accessor Count', format: 'number' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    {
      key: 'data',
      label: 'Data',
      children: itemSummaryFields,
    },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'type_name', label: 'Type Name' },
  ],
};

export const podioGetObjectTaskSummaryOutputSchema: OutputSchema = {
  fields: taskSummaryFields,
};

export const podioGetObjectsOnAppWithTagOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'objects',
      label: 'Objects',
      labelKey: 'title',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'created_on', label: 'Created', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'contract_status', label: 'Contract Status' },
    {
      key: 'created_by',
      label: 'Created By',
      children: profileFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'domains', label: 'Domains' },
    { key: 'from_sharefile', label: 'From ShareFile', format: 'boolean' },
    { key: 'grants_count', label: 'Grants Count', format: 'number' },
    { key: 'image', label: 'Image' },
    { key: 'logo', label: 'Logo' },
    { key: 'name', label: 'Name' },
    { key: 'org_id', label: 'Organization ID', format: 'number' },
    { key: 'premium', label: 'Premium', format: 'boolean' },
    { key: 'rights', label: 'Rights' },
    { key: 'role', label: 'Role' },
    { key: 'sales_agent_id', label: 'Sales Agent ID', format: 'number' },
    { key: 'segment', label: 'Segment' },
    { key: 'segment_size', label: 'Segment Size', format: 'number' },
    { key: 'sharefile', label: 'ShareFile' },
    {
      key: 'sharefile_vault_enabled',
      label: 'ShareFile Vault Enabled',
      format: 'boolean',
    },
    { key: 'status', label: 'Status' },
    { key: 'tier', label: 'Tier' },
    { key: 'trial_expired_on', label: 'Trial Expired', format: 'datetime' },
    { key: 'type', label: 'Type' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'url_label', label: 'URL Label' },
    { key: 'user_limit', label: 'User Limit', format: 'number' },
  ],
};

export const podioGetOrganizationAdminsOutputSchema: OutputSchema = {
  fields: [
    { key: 'admins', label: 'Admins' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetOrganizationAppStoreProfileOutputSchema: OutputSchema = {
  fields: [
    { key: 'external_id', label: 'External ID' },
    { key: 'image', label: 'Image' },
    { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
    { key: 'link', label: 'Link' },
    { key: 'org_id', label: 'Organization ID', format: 'number' },
    { key: 'profile_id', label: 'Profile ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'rights', label: 'Rights' },
    { key: 'space_id', label: 'Space ID' },
    { key: 'user_id', label: 'User ID' },
    { key: 'about', label: 'About' },
    { key: 'name', label: 'Name' },
  ],
};

export const podioGetOrganizationContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'name',
      listItems: [
        { key: 'external_id', label: 'External ID' },
        { key: 'image', label: 'Image' },
        { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'org_id', label: 'Organization ID' },
        { key: 'profile_id', label: 'Profile ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'rights', label: 'Rights' },
        { key: 'space_id', label: 'Space ID' },
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'app_store_about', label: 'App Store About' },
        { key: 'app_store_organization', label: 'App Store Organization' },
        { key: 'app_store_title', label: 'App Store Title' },
        { key: 'app_store_url', label: 'App Store URL', format: 'url' },
        { key: 'mail', label: 'Email' },
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetOrganizationLoginReportOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'weeks',
      label: 'Weeks',
      listItems: [
        { key: 'active', label: 'Active', format: 'number' },
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'total', label: 'Total', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetOrganizationMemberOutputSchema: OutputSchema = {
  fields: [
    { key: 'admin', label: 'Admin', format: 'boolean' },
    { key: 'employee', label: 'Employee', format: 'boolean' },
    {
      key: 'profile',
      label: 'Profile',
      children: profileExternalFields,
    },
    { key: 'role', label: 'Role' },
    { key: 'role_type', label: 'Role Type' },
    { key: 'space_memberships', label: 'Space Memberships', format: 'number' },
    { key: 'tier', label: 'Tier' },
    {
      key: 'user',
      label: 'User',
      children: userAccountFields,
    },
  ],
};

export const podioGetOrganizationMembersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'members',
      label: 'Members',
      listItems: [
        { key: 'admin', label: 'Admin', format: 'boolean' },
        { key: 'employee', label: 'Employee', format: 'boolean' },
        {
          key: 'profile',
          label: 'Profile',
          children: [
            { key: 'external_id', label: 'External ID' },
            { key: 'image', label: 'Image' },
            { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'org_id', label: 'Organization ID' },
            { key: 'profile_id', label: 'Profile ID', format: 'number' },
            { key: 'type', label: 'Type' },
            { key: 'space_id', label: 'Space ID' },
            { key: 'user_id', label: 'User ID', format: 'number' },
            { key: 'app_store_about', label: 'App Store About' },
            { key: 'app_store_organization', label: 'App Store Organization' },
            { key: 'app_store_title', label: 'App Store Title' },
            { key: 'app_store_url', label: 'App Store URL', format: 'url' },
            { key: 'mail', label: 'Email' },
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'country', label: 'Country' },
          ],
        },
        { key: 'role', label: 'Role' },
        { key: 'role_type', label: 'Role Type' },
        {
          key: 'space_memberships',
          label: 'Space Memberships',
          format: 'number',
        },
        { key: 'tier', label: 'Tier' },
        {
          key: 'user',
          label: 'User',
          children: userAccountFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetOrganizationTaskSummaryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'overdue',
      label: 'Overdue',
      children: taskListNestedFields,
    },
    {
      key: 'today',
      label: 'Today',
      children: taskListFields,
    },
    {
      key: 'other',
      label: 'Other',
      children: taskListNestedFields,
    },
  ],
};

export const podioGetOrgsWithPrivateSharesOutputSchema: OutputSchema = {
  fields: [
    { key: 'orgs', label: 'Organizations' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetOwnSharesOutputSchema: OutputSchema = {
  fields: [
    { key: 'shares', label: 'Shares' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const podioGetPersonalTaskSummaryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'overdue',
      label: 'Overdue',
      children: taskListFields,
    },
    {
      key: 'today',
      label: 'Today',
      children: taskListFields,
    },
    {
      key: 'other',
      label: 'Other',
      children: [
        {
          key: 'tasks',
          label: 'Tasks',
          listItems: [
            { key: 'description', label: 'Description' },
            { key: 'due_date', label: 'Due Date', format: 'date' },
            { key: 'due_on', label: 'Due At', format: 'datetime' },
            { key: 'due_time', label: 'Due Time' },
            { key: 'external_id', label: 'External ID' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'private', label: 'Private', format: 'boolean' },
            {
              key: 'responsible',
              label: 'Responsible',
              children: profileFields,
            },
            { key: 'space_id', label: 'Space ID' },
            { key: 'status', label: 'Status' },
            { key: 'task_id', label: 'Task ID', format: 'number' },
            { key: 'text', label: 'Text' },
          ],
        },
        { key: 'total', label: 'Total', format: 'number' },
      ],
    },
  ],
};

export const podioGetProfileOutputSchema: OutputSchema = {
  fields: contactFields,
};

export const podioGetProfileFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'values', label: 'Values' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetQuestionAnswersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'answers',
      label: 'Answers',
      listItems: [
        {
          key: 'question_option_id',
          label: 'Question Option ID',
          format: 'number',
        },
        {
          key: 'user',
          label: 'User',
          children: profileFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetRatingsOutputSchema: OutputSchema = {
  fields: ratingSummaryFields,
};

export const podioGetRecommendedSharesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'shares',
      label: 'Shares',
      labelKey: 'name',
      listItems: [
        { key: 'abstract', label: 'Abstract' },
        {
          key: 'children',
          label: 'Children',
          labelKey: 'name',
          listItems: appPackFields,
        },
        { key: 'icon', label: 'Icon' },
        { key: 'icon_id', label: 'Icon ID', format: 'number' },
        { key: 'installs', label: 'Installs' },
        { key: 'integration', label: 'Integration' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'name', label: 'Name' },
        {
          key: 'parents',
          label: 'Parents',
          labelKey: 'name',
          listItems: appPackFields,
        },
        { key: 'rating', label: 'Rating', format: 'number' },
        { key: 'share_id', label: 'Share ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'visible', label: 'Visible', format: 'boolean' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const podioGetRecurrenceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'config',
      label: 'Configuration',
      children: [{ key: 'days', label: 'Days' }],
    },
    { key: 'name', label: 'Name' },
    { key: 'step', label: 'Step', format: 'number' },
    { key: 'until', label: 'Until', format: 'date' },
  ],
};

export const podioGetReferencesToItemByFieldOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'title',
      listItems: itemRefFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetReminderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'remind_delta',
      label: 'Remind Before (Minutes)',
      format: 'duration',
    },
  ],
};

export const podioGetResultOfVotingOnItemOutputSchema: OutputSchema = {
  fields: votingResultFields,
};

export const podioGetRunningBatchesOutputSchema: OutputSchema = {
  fields: [
    { key: 'batches', label: 'Batches' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetShareOutputSchema: OutputSchema = {
  fields: [
    { key: 'abstract', label: 'Abstract' },
    {
      key: 'author',
      label: 'Author',
      children: profileFields,
    },
    { key: 'author_apps', label: 'Author Apps', format: 'number' },
    { key: 'author_packs', label: 'Author Packs', format: 'number' },
    {
      key: 'categories',
      label: 'Categories',
      children: categoryGroupFields,
    },
    { key: 'children', label: 'Children' },
    { key: 'comments', label: 'Comments' },
    { key: 'description', label: 'Description' },
    { key: 'features', label: 'Features' },
    { key: 'icon', label: 'Icon' },
    { key: 'icon_id', label: 'Icon ID', format: 'number' },
    { key: 'installs', label: 'Installs', format: 'number' },
    { key: 'integration', label: 'Integration' },
    { key: 'language', label: 'Language' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'name', label: 'Name' },
    {
      key: 'org',
      label: 'Organization',
      children: [
        { key: 'profile', label: 'Profile' },
        { key: 'role', label: 'Role' },
        { key: 'url_label', label: 'URL Label' },
      ],
    },
    { key: 'parents', label: 'Parents' },
    {
      key: 'ratings',
      label: 'Ratings',
      children: ratingFields,
    },
    { key: 'scope', label: 'Scope' },
    { key: 'screenshots', label: 'Screenshots' },
    { key: 'share_id', label: 'Share ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'shared_on', label: 'Shared', format: 'datetime' },
    { key: 'status', label: 'Status' },
    { key: 'user_rating', label: 'User Rating' },
    { key: 'video', label: 'Video' },
    { key: 'visible', label: 'Visible', format: 'boolean' },
  ],
};

export const podioGetShareByReferenceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'shares',
      label: 'Shares',
      labelKey: 'name',
      listItems: [
        { key: 'abstract', label: 'Abstract' },
        {
          key: 'author',
          label: 'Author',
          children: profileFields,
        },
        {
          key: 'categories',
          label: 'Categories',
          children: categoryGroupFields,
        },
        { key: 'children', label: 'Children' },
        { key: 'description', label: 'Description' },
        { key: 'icon', label: 'Icon' },
        { key: 'icon_id', label: 'Icon ID', format: 'number' },
        { key: 'installs', label: 'Installs', format: 'number' },
        { key: 'integration', label: 'Integration' },
        { key: 'language', label: 'Language' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'name', label: 'Name' },
        { key: 'parents', label: 'Parents' },
        { key: 'scope', label: 'Scope' },
        { key: 'screenshots', label: 'Screenshots' },
        { key: 'share_id', label: 'Share ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'shared_on', label: 'Shared', format: 'datetime' },
        { key: 'status', label: 'Status' },
        { key: 'video', label: 'Video' },
        { key: 'visible', label: 'Visible', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetSharedOrganizationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        { key: 'contract_status', label: 'Contract Status' },
        { key: 'domains', label: 'Domains' },
        { key: 'image', label: 'Image' },
        { key: 'logo', label: 'Logo' },
        { key: 'name', label: 'Name' },
        { key: 'org_id', label: 'Organization ID', format: 'number' },
        { key: 'premium', label: 'Premium', format: 'boolean' },
        { key: 'segment', label: 'Segment' },
        { key: 'segment_size', label: 'Segment Size', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'tier', label: 'Tier' },
        { key: 'type', label: 'Type' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'url_label', label: 'URL Label' },
        {
          key: 'spaces',
          label: 'Spaces',
          labelKey: 'name',
          listItems: spaceFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetSharesByCategoryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'shares',
      label: 'Shares',
      labelKey: 'name',
      listItems: [
        { key: 'abstract', label: 'Abstract' },
        {
          key: 'children',
          label: 'Children',
          labelKey: 'name',
          listItems: appPackFields,
        },
        { key: 'icon', label: 'Icon' },
        { key: 'icon_id', label: 'Icon ID', format: 'number' },
        { key: 'installs', label: 'Installs' },
        { key: 'integration', label: 'Integration' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'name', label: 'Name' },
        {
          key: 'parents',
          label: 'Parents',
          labelKey: 'name',
          listItems: appPackFields,
        },
        { key: 'rating', label: 'Rating' },
        { key: 'share_id', label: 'Share ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'visible', label: 'Visible', format: 'boolean' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const podioGetSpaceOutputSchema: OutputSchema = {
  fields: [
    { key: 'auto_join', label: 'Auto Join', format: 'boolean' },
    {
      key: 'created_by',
      label: 'Created By',
      children: profileFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'description', label: 'Description' },
    { key: 'is_overdue', label: 'Overdue', format: 'boolean' },
    {
      key: 'item_accounting_info',
      label: 'Item Usage',
      children: usageQuotaFields,
    },
    { key: 'name', label: 'Name' },
    {
      key: 'org',
      label: 'Organization',
      children: [
        { key: 'contract_status', label: 'Contract Status' },
        { key: 'domains', label: 'Domains' },
        { key: 'grants_count', label: 'Grants Count', format: 'number' },
        { key: 'image', label: 'Image' },
        { key: 'logo', label: 'Logo' },
        { key: 'name', label: 'Name' },
        { key: 'org_id', label: 'Organization ID', format: 'number' },
        { key: 'premium', label: 'Premium', format: 'boolean' },
        { key: 'rights', label: 'Rights' },
        { key: 'role', label: 'Role' },
        { key: 'sales_agent_id', label: 'Sales Agent ID', format: 'number' },
        { key: 'segment', label: 'Segment' },
        { key: 'segment_size', label: 'Segment Size', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'tier', label: 'Tier' },
        { key: 'trial_expired_on', label: 'Trial Expired', format: 'datetime' },
        { key: 'type', label: 'Type' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'url_label', label: 'URL Label' },
        { key: 'user_limit', label: 'User Limit', format: 'number' },
      ],
    },
    { key: 'org_id', label: 'Organization ID', format: 'number' },
    {
      key: 'owner',
      label: 'Owner',
      children: objectRefFields,
    },
    { key: 'post_on_new_app', label: 'Post On New App', format: 'boolean' },
    {
      key: 'post_on_new_member',
      label: 'Post On New Member',
      format: 'boolean',
    },
    { key: 'premium', label: 'Premium', format: 'boolean' },
    { key: 'privacy', label: 'Privacy' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'role', label: 'Role' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'space_id', label: 'Space ID', format: 'number' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    {
      key: 'task_accounting_info',
      label: 'Task Usage',
      children: userUsageQuotaFields,
    },
    { key: 'tier', label: 'Tier' },
    { key: 'type', label: 'Type' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'url_label', label: 'URL Label' },
    { key: 'v8_engine_updated', label: 'V8 Engine Updated', format: 'boolean' },
    { key: 'video', label: 'Video' },
    {
      key: 'workflow_accounting_info',
      label: 'Workflow Usage',
      children: usageQuotaFields,
    },
  ],
};

export const podioGetSpaceByOrgAndUrlLabelOutputSchema: OutputSchema = {
  fields: spaceDetailFields,
};

export const podioGetSpaceContactsOutputSchema: OutputSchema = {
  fields: [
    { key: 'contacts', label: 'Contacts' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetSpaceMemberOutputSchema: OutputSchema = {
  fields: spaceMemberFields,
};

export const podioGetSpaceMembershipOutputSchema: OutputSchema = {
  fields: membershipFields,
};

export const podioGetSpaceMembershipsForOrgMemberOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'memberships',
      label: 'Memberships',
      listItems: [
        { key: 'grants', label: 'Grants', format: 'number' },
        { key: 'role', label: 'Role' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetSpaceTaskSummaryOutputSchema: OutputSchema = {
  fields: taskSummaryFields,
};

export const podioGetStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'comments', label: 'Comments' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'embed', label: 'Embed' },
    { key: 'embed_file', label: 'Embed File' },
    { key: 'files', label: 'Files' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'last_edit_on', label: 'Last Edited', format: 'datetime' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'questions', label: 'Questions' },
    {
      key: 'ratings',
      label: 'Ratings',
      children: [
        {
          key: 'like',
          label: 'Like',
          children: ratingFields,
        },
      ],
    },
    { key: 'rich_value', label: 'Rich Text Value' },
    { key: 'rights', label: 'Rights' },
    { key: 'status_id', label: 'Status ID', format: 'number' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    {
      key: 'user',
      label: 'User',
      children: userFields,
    },
    { key: 'user_ratings', label: 'User Ratings' },
    { key: 'value', label: 'Value' },
  ],
};

export const podioGetStreamObjectOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'activity_groups',
      label: 'Activity Groups',
      listItems: [
        {
          key: 'activities',
          label: 'Activities',
          listItems: [
            { key: 'created_on', label: 'Created', format: 'datetime' },
            {
              key: 'created_via',
              label: 'Created Via',
              children: createdViaFields,
            },
            { key: 'data', label: 'Data' },
            {
              key: 'data_ref',
              label: 'Data Reference',
              children: objectRefFields,
            },
            { key: 'event_id', label: 'Event ID', format: 'number' },
            { key: 'type', label: 'Type' },
          ],
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'created_via',
          label: 'Created Via',
          children: createdViaFields,
        },
        { key: 'group_id', label: 'Group ID', format: 'number' },
        { key: 'kind', label: 'Kind' },
      ],
    },
    {
      key: 'app',
      label: 'App',
      children: appFields,
    },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'app_item_id', label: 'App Item ID', format: 'number' },
        { key: 'item_id', label: 'Item ID', format: 'number' },
        { key: 'revision', label: 'Revision', format: 'number' },
        {
          key: 'sharefile_vault_folder_id',
          label: 'ShareFile Vault Folder ID',
        },
        { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
        { key: 'title', label: 'Title' },
      ],
    },
    {
      key: 'files',
      label: 'Files',
      labelKey: 'name',
      listItems: fileFields,
    },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    {
      key: 'org',
      label: 'Organization',
      children: organizationFields,
    },
    { key: 'rights', label: 'Rights' },
    {
      key: 'space',
      label: 'Space',
      children: spaceFields,
    },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
  ],
};

export const podioGetSubscriptionByIdOutputSchema: OutputSchema = {
  fields: [
    { key: 'started_on', label: 'Started', format: 'datetime' },
    {
      key: 'ref',
      label: 'Reference',
      children: objectRefFields,
    },
  ],
};

export const podioGetTagsOnAppOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tags',
      label: 'Tags',
      listItems: [
        { key: 'count', label: 'Count', format: 'number' },
        { key: 'text', label: 'Text' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'comments', label: 'Comments' },
    { key: 'completed_by', label: 'Completed By' },
    { key: 'completed_on', label: 'Completed', format: 'datetime' },
    { key: 'completed_via', label: 'Completed Via' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'description', label: 'Description' },
    { key: 'due_date', label: 'Due Date', format: 'date' },
    { key: 'due_on', label: 'Due At', format: 'datetime' },
    { key: 'due_time', label: 'Due Time' },
    { key: 'external_id', label: 'External ID' },
    { key: 'files', label: 'Files' },
    { key: 'is_liked', label: 'Liked', format: 'boolean' },
    {
      key: 'labels',
      label: 'Labels',
      listItems: labelFields,
    },
    { key: 'like_count', label: 'Like Count', format: 'number' },
    { key: 'link', label: 'Link', format: 'url' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'private', label: 'Private', format: 'boolean' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'recurrence', label: 'Recurrence' },
    {
      key: 'ref',
      label: 'Reference',
      children: referenceDetailFields,
    },
    { key: 'reminder', label: 'Reminder' },
    {
      key: 'responsible',
      label: 'Responsible',
      children: profileFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'space_id', label: 'Space ID', format: 'number' },
    { key: 'started', label: 'Started', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'task_id', label: 'Task ID', format: 'number' },
    { key: 'text', label: 'Text' },
  ],
};

export const podioGetTaskTotalsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'own',
      label: 'Own',
      children: taskTotalFields,
    },
    {
      key: 'reassigned',
      label: 'Reassigned',
      children: taskTotalFields,
    },
  ],
};

export const podioGetTopAppsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'apps',
      label: 'Apps',
      listItems: [
        { key: 'app_id', label: 'App ID', format: 'number' },
        {
          key: 'config',
          label: 'Configuration',
          children: appConfigFields,
        },
        {
          key: 'current_revision',
          label: 'Current Revision',
          format: 'number',
        },
        { key: 'default_view_id', label: 'Default View ID' },
        { key: 'is_default', label: 'Default', format: 'boolean' },
        {
          key: 'item_accounting_info',
          label: 'Item Usage',
          children: usageQuotaFields,
        },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'link_add', label: 'Add Link', format: 'url' },
        { key: 'rights', label: 'Rights' },
        { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
        { key: 'space_id', label: 'Space ID', format: 'number' },
        { key: 'status', label: 'Status' },
        {
          key: 'task_accounting_info',
          label: 'Task Usage',
          children: userUsageQuotaFields,
        },
        { key: 'url_add', label: 'Add URL', format: 'url' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'url_label', label: 'URL Label' },
        {
          key: 'workflow_accounting_info',
          label: 'Workflow Usage',
          children: usageQuotaFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetTopSpacesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'spaces',
      label: 'Spaces',
      labelKey: 'name',
      listItems: spaceWithOrgFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetTopTagsOnAppOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioGetUserOutputSchema: OutputSchema = {
  fields: userDetailFields,
};

export const podioGetUserNotificationSettingOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Value', format: 'boolean' }],
};

export const podioGetUserNotificationSettingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'bulletin', label: 'Bulletin', format: 'boolean' },
    { key: 'digest', label: 'Digest', format: 'boolean' },
    { key: 'meeting_update', label: 'Meeting Update', format: 'boolean' },
    {
      key: 'meeting_update_as_organizer',
      label: 'Meeting Update As Organizer',
      format: 'boolean',
    },
    { key: 'message', label: 'Message', format: 'boolean' },
    { key: 'push_notification', label: 'Push Notification', format: 'boolean' },
    {
      key: 'push_notification_browser',
      label: 'Push Notification Browser',
      format: 'boolean',
    },
    {
      key: 'push_notification_sound',
      label: 'Push Notification Sound',
      format: 'boolean',
    },
    { key: 'reference', label: 'Reference', format: 'boolean' },
    { key: 'reminder', label: 'Reminder', format: 'boolean' },
    { key: 'space', label: 'Space', format: 'boolean' },
    { key: 'subscription', label: 'Subscription', format: 'boolean' },
  ],
};

export const podioGetUserProfilesWithAccessToObjectOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'profiles', label: 'Profiles' },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  };

export const podioGetUserPropertyOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Value' }],
};

export const podioGetUserStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'betas', label: 'Betas' },
    { key: 'calendar_code', label: 'Calendar Code' },
    { key: 'flags', label: 'Flags' },
    { key: 'inbox', label: 'Inbox' },
    { key: 'inbox_new', label: 'Inbox New', format: 'number' },
    { key: 'mailbox', label: 'Mailbox' },
    {
      key: 'message_unread_count',
      label: 'Message Unread Count',
      format: 'number',
    },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    {
      key: 'profile',
      label: 'Profile',
      children: [
        { key: 'external_id', label: 'External ID' },
        { key: 'image', label: 'Image' },
        { key: 'last_seen_on', label: 'Last Seen', format: 'datetime' },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'org_id', label: 'Organization ID' },
        { key: 'profile_id', label: 'Profile ID', format: 'number' },
        {
          key: 'push',
          label: 'Push',
          children: pushFields,
        },
        { key: 'type', label: 'Type' },
        { key: 'space_id', label: 'Space ID' },
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'country', label: 'Country' },
        { key: 'mail', label: 'Email' },
        { key: 'name', label: 'Name' },
      ],
    },
    {
      key: 'properties',
      label: 'Properties',
      dynamicKey: true,
      children: [{ key: 'value', label: 'Value' }],
    },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    {
      key: 'referral',
      label: 'Referral',
      children: [
        { key: 'status', label: 'Status' },
        { key: 'code', label: 'Code' },
      ],
    },
    {
      key: 'user',
      label: 'User',
      children: userDetailFields,
    },
  ],
};

export const podioGetViewOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'created_by',
      label: 'Created By',
      children: profileFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    { key: 'field_visibility_revision', label: 'Field Visibility Revision' },
    { key: 'fields', label: 'Fields' },
    { key: 'filter_id', label: 'Filter ID', format: 'number' },
    { key: 'filters', label: 'Filters' },
    { key: 'grouping', label: 'Grouping' },
    { key: 'groupings', label: 'Groupings' },
    { key: 'layout', label: 'Layout' },
    { key: 'name', label: 'Name' },
    { key: 'private', label: 'Private', format: 'boolean' },
    { key: 'rights', label: 'Rights' },
    { key: 'sort_by', label: 'Sort By' },
    { key: 'sort_desc', label: 'Sort Desc', format: 'boolean' },
    { key: 'type', label: 'Type' },
    { key: 'view_id', label: 'View ID', format: 'number' },
  ],
};

export const podioGetWhoLikedObjectOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'profiles',
      label: 'Profiles',
      labelKey: 'name',
      listItems: profileFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioInstallAppOutputSchema: OutputSchema = {
  fields: [{ key: 'app_id', label: 'App ID', format: 'number' }],
};

export const podioInstallShareOutputSchema: OutputSchema = {
  fields: [
    { key: 'child_app_ids', label: 'Child App IDs' },
    { key: 'app_id', label: 'App ID', format: 'number' },
  ],
};

export const podioListAccessibleOrgSpacesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'spaces',
      label: 'Spaces',
      labelKey: 'name',
      listItems: spaceFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListAllOrgSpacesAdminOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'spaces',
      label: 'Spaces',
      labelKey: 'name',
      listItems: [
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'item_accounting_info',
          label: 'Item Usage',
          children: usageQuotaFields,
        },
        { key: 'last_activity_on', label: 'Last Activity', format: 'datetime' },
        { key: 'member_count', label: 'Member Count', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'org_id', label: 'Organization ID', format: 'number' },
        { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
        { key: 'space_id', label: 'Space ID', format: 'number' },
        {
          key: 'task_accounting_info',
          label: 'Task Usage',
          children: userUsageQuotaFields,
        },
        { key: 'type', label: 'Type' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'url_label', label: 'URL Label' },
        {
          key: 'v8_engine_updated',
          label: 'V8 Engine Updated',
          format: 'boolean',
        },
        {
          key: 'workflow_accounting_info',
          label: 'Workflow Usage',
          children: usageQuotaFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListAppMarketCategoriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'vertical',
      label: 'Vertical',
      labelKey: 'name',
      listItems: appCategoryFields,
    },
    {
      key: 'functional',
      label: 'Functional',
      labelKey: 'name',
      listItems: appCategoryFields,
    },
  ],
};

export const podioListAppsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'apps',
      label: 'Apps',
      listItems: appBasicFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListAppsInSpaceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'apps',
      label: 'Apps',
      listItems: [
        { key: 'app_id', label: 'App ID', format: 'number' },
        {
          key: 'config',
          label: 'Configuration',
          children: appConfigFields,
        },
        {
          key: 'current_revision',
          label: 'Current Revision',
          format: 'number',
        },
        { key: 'default_view_id', label: 'Default View ID' },
        { key: 'is_default', label: 'Default', format: 'boolean' },
        {
          key: 'item_accounting_info',
          label: 'Item Usage',
          children: usageQuotaFields,
        },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'link_add', label: 'Add Link', format: 'url' },
        { key: 'original', label: 'Original', format: 'number' },
        { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
        { key: 'space_id', label: 'Space ID', format: 'number' },
        { key: 'status', label: 'Status' },
        {
          key: 'task_accounting_info',
          label: 'Task Usage',
          children: userUsageQuotaFields,
        },
        { key: 'url_add', label: 'Add URL', format: 'url' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'url_label', label: 'URL Label' },
        {
          key: 'workflow_accounting_info',
          label: 'Workflow Usage',
          children: usageQuotaFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      listItems: commentFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListContactSkillsOutputSchema: OutputSchema = {
  fields: [
    { key: 'skills', label: 'Skills' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListFlowsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'flows',
      label: 'Flows',
      labelKey: 'name',
      listItems: flowFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListFormsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'forms',
      label: 'Forms',
      listItems: formFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListObjectTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      listItems: taskFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListOrgSpacesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'spaces',
      label: 'Spaces',
      labelKey: 'name',
      listItems: spaceDetailFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListOrganizationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        { key: 'contract_status', label: 'Contract Status' },
        { key: 'domains', label: 'Domains' },
        { key: 'grants_count', label: 'Grants Count', format: 'number' },
        { key: 'image', label: 'Image' },
        { key: 'logo', label: 'Logo' },
        { key: 'name', label: 'Name' },
        { key: 'org_id', label: 'Organization ID', format: 'number' },
        { key: 'premium', label: 'Premium', format: 'boolean' },
        { key: 'rights', label: 'Rights' },
        { key: 'role', label: 'Role' },
        { key: 'sales_agent_id', label: 'Sales Agent ID', format: 'number' },
        { key: 'segment', label: 'Segment' },
        { key: 'segment_size', label: 'Segment Size', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'tier', label: 'Tier' },
        { key: 'trial_expired_on', label: 'Trial Expired', format: 'datetime' },
        { key: 'type', label: 'Type' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'url_label', label: 'URL Label' },
        { key: 'user_limit', label: 'User Limit', format: 'number' },
        { key: 'rank', label: 'Rank', format: 'number' },
        {
          key: 'spaces',
          label: 'Spaces',
          labelKey: 'name',
          listItems: [
            { key: 'archived', label: 'Archived', format: 'boolean' },
            {
              key: 'item_accounting_info',
              label: 'Item Usage',
              children: usageQuotaFields,
            },
            { key: 'name', label: 'Name' },
            { key: 'org_id', label: 'Organization ID', format: 'number' },
            { key: 'premium', label: 'Premium', format: 'boolean' },
            {
              key: 'push',
              label: 'Push',
              children: pushFields,
            },
            { key: 'rights', label: 'Rights' },
            { key: 'role', label: 'Role' },
            { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
            { key: 'space_id', label: 'Space ID', format: 'number' },
            {
              key: 'task_accounting_info',
              label: 'Task Usage',
              children: userUsageQuotaFields,
            },
            { key: 'tier', label: 'Tier' },
            { key: 'type', label: 'Type' },
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'url_label', label: 'URL Label' },
            {
              key: 'v8_engine_updated',
              label: 'V8 Engine Updated',
              format: 'boolean',
            },
            {
              key: 'workflow_accounting_info',
              label: 'Workflow Usage',
              children: usageQuotaFields,
            },
            { key: 'rank', label: 'Rank', format: 'number' },
            { key: 'top', label: 'Top', format: 'boolean' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListRatingsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'like',
      label: 'Like',
      children: ratingSummaryFields,
    },
  ],
};

export const podioListSpaceMembersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'members',
      label: 'Members',
      listItems: spaceMemberFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListSpaceMembersByRoleOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'members',
      label: 'Members',
      listItems: membershipFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListSpaceMembershipsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'memberships',
      label: 'Memberships',
      listItems: membershipFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListSpaceStreamEventsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'title',
      listItems: [
        {
          key: 'activity',
          label: 'Activity',
          labelKey: 'id',
          listItems: [
            { key: 'activity_type', label: 'Activity Type' },
            {
              key: 'created_by',
              label: 'Created By',
              children: userFields,
            },
            { key: 'created_on', label: 'Created', format: 'datetime' },
            {
              key: 'created_via',
              label: 'Created Via',
              children: createdViaFields,
            },
            { key: 'data', label: 'Data' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'type', label: 'Type' },
          ],
        },
        {
          key: 'app',
          label: 'App',
          children: appFields,
        },
        { key: 'comments', label: 'Comments' },
        {
          key: 'comments_allowed',
          label: 'Comments Allowed',
          format: 'boolean',
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'created_via',
          label: 'Created Via',
          children: createdViaFields,
        },
        { key: 'data', label: 'Data' },
        { key: 'files', label: 'Files' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'last_update_on', label: 'Last Updated', format: 'datetime' },
        { key: 'link', label: 'Link', format: 'url' },
        {
          key: 'org',
          label: 'Organization',
          children: organizationFields,
        },
        { key: 'rights', label: 'Rights' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        {
          key: 'user_ratings',
          label: 'User Ratings',
          children: [{ key: 'like', label: 'Like' }],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListTaskLabelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'labels',
      label: 'Labels',
      listItems: labelFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      listItems: [
        { key: 'description', label: 'Description' },
        { key: 'due_date', label: 'Due Date', format: 'date' },
        { key: 'due_on', label: 'Due At', format: 'datetime' },
        { key: 'due_time', label: 'Due Time' },
        { key: 'external_id', label: 'External ID' },
        { key: 'group', label: 'Group' },
        {
          key: 'labels',
          label: 'Labels',
          listItems: labelFields,
        },
        { key: 'link', label: 'Link', format: 'url' },
        { key: 'private', label: 'Private', format: 'boolean' },
        { key: 'recurrence', label: 'Recurrence' },
        {
          key: 'ref',
          label: 'Reference',
          children: referenceDetailFields,
        },
        { key: 'reminder', label: 'Reminder' },
        {
          key: 'responsible',
          label: 'Responsible',
          children: profileFields,
        },
        { key: 'space_id', label: 'Space ID', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'task_id', label: 'Task ID', format: 'number' },
        { key: 'text', label: 'Text' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'name',
      listItems: [
        {
          key: 'created_by',
          label: 'Created By',
          children: profileFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'field_visibility_revision',
          label: 'Field Visibility Revision',
        },
        { key: 'fields', label: 'Fields' },
        { key: 'filter_id', label: 'Filter ID', format: 'number' },
        { key: 'filters', label: 'Filters' },
        {
          key: 'grouping',
          label: 'Grouping',
          children: [
            { key: 'type', label: 'Type' },
            { key: 'value', label: 'Value', format: 'number' },
            { key: 'sub_value', label: 'Sub Value' },
          ],
        },
        {
          key: 'groupings',
          label: 'Groupings',
          children: [
            { key: 'total', label: 'Total', format: 'number' },
            {
              key: 'groups',
              label: 'Groups',
              labelKey: 'label',
              listItems: [
                { key: 'count', label: 'Count', format: 'number' },
                {
                  key: 'groups',
                  label: 'Groups',
                  labelKey: 'label',
                  listItems: [
                    { key: 'avatar', label: 'Avatar' },
                    { key: 'color', label: 'Color' },
                    { key: 'label', label: 'Label' },
                    { key: 'stars', label: 'Stars' },
                    { key: 'value', label: 'Value', format: 'number' },
                  ],
                },
                { key: 'avatar', label: 'Avatar' },
                { key: 'color', label: 'Color' },
                { key: 'label', label: 'Label' },
                { key: 'stars', label: 'Stars' },
                { key: 'value', label: 'Value', format: 'number' },
              ],
            },
          ],
        },
        { key: 'items', label: 'Items', format: 'number' },
        { key: 'layout', label: 'Layout' },
        { key: 'name', label: 'Name' },
        { key: 'private', label: 'Private', format: 'boolean' },
        { key: 'rights', label: 'Rights' },
        { key: 'sort_by', label: 'Sort By' },
        { key: 'sort_desc', label: 'Sort Desc', format: 'boolean' },
        { key: 'type', label: 'Type' },
        { key: 'view_id', label: 'View ID', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListVotersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'users',
      label: 'Users',
      labelKey: 'name',
      listItems: profileFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioListWidgetsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'widgets',
      label: 'Widgets',
      labelKey: 'title',
      listItems: [
        { key: 'allowed_refs', label: 'Allowed References' },
        { key: 'cols', label: 'Cols', format: 'number' },
        {
          key: 'config',
          label: 'Configuration',
          children: [
            {
              key: 'links',
              label: 'Links',
              listItems: [
                { key: 'title', label: 'Title' },
                { key: 'url', label: 'URL', format: 'url' },
              ],
            },
            { key: 'kind', label: 'Kind' },
            { key: 'limit', label: 'Limit', format: 'number' },
            { key: 'text', label: 'Text' },
          ],
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: profileFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        {
          key: 'data',
          label: 'Data',
          children: [
            { key: 'tasks', label: 'Tasks' },
            { key: 'total', label: 'Total', format: 'number' },
            { key: 'events', label: 'Events' },
          ],
        },
        {
          key: 'ref',
          label: 'Reference',
          children: objectRefFields,
        },
        { key: 'rights', label: 'Rights' },
        { key: 'rows', label: 'Rows', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'widget_id', label: 'Widget ID', format: 'number' },
        { key: 'x', label: 'X Position', format: 'number' },
        { key: 'y', label: 'Y Position', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioPreviewImportRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags' },
    { key: 'app_item_id', label: 'App Item ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: [
        { key: 'field_id', label: 'Field ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'external_id', label: 'External ID' },
        { key: 'label', label: 'Label' },
        {
          key: 'config',
          label: 'Configuration',
          children: [
            { key: 'default_value', label: 'Default Value' },
            { key: 'delta', label: 'Delta', format: 'number' },
            { key: 'description', label: 'Description' },
            { key: 'hidden', label: 'Hidden', format: 'boolean' },
            {
              key: 'hidden_create_view_edit',
              label: 'Hidden In Create And Edit',
              format: 'boolean',
            },
            { key: 'label', label: 'Label' },
            { key: 'mapping', label: 'Mapping' },
            { key: 'read_only', label: 'Read Only', format: 'boolean' },
            { key: 'required', label: 'Required', format: 'boolean' },
            {
              key: 'settings',
              label: 'Settings',
              children: [
                { key: 'size', label: 'Size' },
                { key: 'format', label: 'Format' },
                { key: 'decimals', label: 'Decimals' },
              ],
            },
            { key: 'unique', label: 'Unique', format: 'boolean' },
            { key: 'visible', label: 'Visible', format: 'boolean' },
          ],
        },
        {
          key: 'values',
          label: 'Values',
          listItems: [{ key: 'value', label: 'Value' }],
        },
      ],
    },
  ],
};

export const podioRearrangeItemOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'app',
      label: 'App',
      children: appFields,
    },
    { key: 'app_item_id', label: 'App Item ID', format: 'number' },
    { key: 'app_item_id_formatted', label: 'App Item ID Formatted' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'external_id', label: 'External ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: fieldDefinitionNestedFields,
    },
    { key: 'item_id', label: 'Item ID', format: 'number' },
    { key: 'last_event_on', label: 'Last Event', format: 'datetime' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'linked_account_data', label: 'Linked Account Data' },
    { key: 'linked_account_id', label: 'Linked Account ID' },
    { key: 'participants', label: 'Participants' },
    {
      key: 'presence',
      label: 'Presence',
      children: presenceFields,
    },
    { key: 'priority', label: 'Priority', format: 'number' },
    {
      key: 'push',
      label: 'Push',
      children: pushFields,
    },
    { key: 'recurrence', label: 'Recurrence' },
    { key: 'ref', label: 'Reference' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'revision', label: 'Revision', format: 'number' },
    {
      key: 'current_revision',
      label: 'Current Revision',
      children: revisionFields,
    },
    {
      key: 'initial_revision',
      label: 'Initial Revision',
      children: revisionFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_folder_id', label: 'ShareFile Vault Folder ID' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'subscribed_count', label: 'Subscribed Count', format: 'number' },
    { key: 'title', label: 'Title' },
  ],
};

export const podioReplyToConversationOutputSchema: OutputSchema = {
  fields: [
    { key: 'action', label: 'Action' },
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'embed', label: 'Embed' },
        { key: 'embed_file', label: 'Embed File' },
        { key: 'files', label: 'Files' },
        { key: 'message_id', label: 'Message ID', format: 'number' },
        { key: 'text', label: 'Text' },
      ],
    },
    { key: 'event_id', label: 'Event ID', format: 'number' },
  ],
};

export const podioResolveUrlOutputSchema: OutputSchema = {
  fields: referenceDetailFields,
};

export const podioSearchByAppInSpaceOutputSchema: OutputSchema = {
  fields: [
    { key: 'counts', label: 'Counts' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: [
        {
          key: 'app',
          label: 'App',
          children: appBasicFields,
        },
        {
          key: 'created_by',
          label: 'Created By',
          children: userFields,
        },
        { key: 'created_on', label: 'Created', format: 'datetime' },
        { key: 'highlight', label: 'Highlight' },
        { key: 'id', label: 'ID', format: 'number' },
        {
          key: 'item',
          label: 'Item',
          children: itemRefFields,
        },
        { key: 'link', label: 'Link', format: 'url' },
        {
          key: 'org',
          label: 'Organization',
          children: organizationFields,
        },
        { key: 'rank', label: 'Rank', format: 'number' },
        { key: 'search_id', label: 'Search ID' },
        {
          key: 'space',
          label: 'Space',
          children: spaceFields,
        },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
};

export const podioSearchGloballyOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'counts',
      label: 'Counts',
      children: [
        { key: 'app', label: 'App', format: 'number' },
        { key: 'file', label: 'File', format: 'number' },
        { key: 'item', label: 'Item', format: 'number' },
        { key: 'space', label: 'Space', format: 'number' },
      ],
    },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: searchResultFields,
    },
  ],
};

export const podioSearchGloballyWithStatusesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: searchResultFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioSearchInOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'counts', label: 'Counts' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: searchResultFields,
    },
  ],
};

export const podioSearchReferencesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        {
          key: 'data',
          label: 'Data',
          children: [
            { key: 'app_id', label: 'App ID', format: 'number' },
            {
              key: 'config',
              label: 'Configuration',
              children: appConfigFields,
            },
            {
              key: 'current_revision',
              label: 'Current Revision',
              format: 'number',
            },
            {
              key: 'default_view_id',
              label: 'Default View ID',
              format: 'number',
            },
            { key: 'is_default', label: 'Default', format: 'boolean' },
            {
              key: 'item_accounting_info',
              label: 'Item Usage',
              children: usageQuotaFields,
            },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'link_add', label: 'Add Link', format: 'url' },
            { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
            {
              key: 'space',
              label: 'Space',
              children: spaceWithOrgFields,
            },
            { key: 'space_id', label: 'Space ID', format: 'number' },
            { key: 'status', label: 'Status' },
            {
              key: 'task_accounting_info',
              label: 'Task Usage',
              children: userUsageQuotaFields,
            },
            { key: 'url_add', label: 'Add URL', format: 'url' },
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'url_label', label: 'URL Label' },
            {
              key: 'workflow_accounting_info',
              label: 'Workflow Usage',
              children: usageQuotaFields,
            },
          ],
        },
        {
          key: 'contents',
          label: 'Contents',
          labelKey: 'title',
          listItems: [
            { key: 'app_item_id', label: 'App Item ID', format: 'number' },
            {
              key: 'badge_relationship',
              label: 'Badge Relationship',
              children: [
                { key: 'guest', label: 'Guest', format: 'boolean' },
                {
                  key: 'item',
                  label: 'Item',
                  children: [
                    {
                      key: 'app',
                      label: 'App',
                      children: [
                        { key: 'app_id', label: 'App ID', format: 'number' },
                        { key: 'config', label: 'Configuration' },
                        {
                          key: 'current_revision',
                          label: 'Current Revision',
                          format: 'number',
                        },
                        {
                          key: 'default_view_id',
                          label: 'Default View ID',
                          format: 'number',
                        },
                        { key: 'icon', label: 'Icon' },
                        { key: 'icon_id', label: 'Icon ID', format: 'number' },
                        {
                          key: 'is_default',
                          label: 'Default',
                          format: 'boolean',
                        },
                        { key: 'item_accounting_info', label: 'Item Usage' },
                        { key: 'item_name', label: 'Item Name' },
                        { key: 'link', label: 'Link', format: 'url' },
                        { key: 'link_add', label: 'Add Link', format: 'url' },
                        { key: 'name', label: 'Name' },
                        { key: 'rights', label: 'Rights' },
                        {
                          key: 'sharefile_vault_url',
                          label: 'ShareFile Vault URL',
                        },
                        {
                          key: 'space_id',
                          label: 'Space ID',
                          format: 'number',
                        },
                        { key: 'status', label: 'Status' },
                        { key: 'task_accounting_info', label: 'Task Usage' },
                        { key: 'url_add', label: 'Add URL', format: 'url' },
                        { key: 'url', label: 'URL', format: 'url' },
                        { key: 'url_label', label: 'URL Label' },
                        {
                          key: 'workflow_accounting_info',
                          label: 'Workflow Usage',
                        },
                      ],
                    },
                    {
                      key: 'app_item_id',
                      label: 'App Item ID',
                      format: 'number',
                    },
                    {
                      key: 'app_item_id_formatted',
                      label: 'App Item ID Formatted',
                    },
                    {
                      key: 'created_by',
                      label: 'Created By',
                      children: userFields,
                    },
                    { key: 'created_on', label: 'Created', format: 'datetime' },
                    {
                      key: 'created_via',
                      label: 'Created Via',
                      children: createdViaFields,
                    },
                    {
                      key: 'email_item_comment_app',
                      label: 'Email Item Comment App',
                      children: emailContactFields,
                    },
                    {
                      key: 'email_item_comment_user',
                      label: 'Email Item Comment User',
                      children: emailContactFields,
                    },
                    {
                      key: 'file_count',
                      label: 'File Count',
                      format: 'number',
                    },
                    { key: 'item_id', label: 'Item ID', format: 'number' },
                    { key: 'link', label: 'Link', format: 'url' },
                    { key: 'participants', label: 'Participants' },
                    { key: 'revision', label: 'Revision', format: 'number' },
                    {
                      key: 'current_revision',
                      label: 'Current Revision',
                      children: revisionBasicFields,
                    },
                    {
                      key: 'initial_revision',
                      label: 'Initial Revision',
                      children: revisionBasicFields,
                    },
                    { key: 'rights', label: 'Rights' },
                    {
                      key: 'sharefile_vault_folder_id',
                      label: 'ShareFile Vault Folder ID',
                    },
                    {
                      key: 'sharefile_vault_url',
                      label: 'ShareFile Vault URL',
                    },
                    {
                      key: 'space',
                      label: 'Space',
                      children: spaceBasicFields,
                    },
                    { key: 'tags', label: 'Tags' },
                    { key: 'title', label: 'Title' },
                    { key: 'votes', label: 'Votes' },
                  ],
                },
                {
                  key: 'layout',
                  label: 'Layout',
                  children: [
                    { key: 'app_id', label: 'App ID', format: 'number' },
                    { key: 'default', label: 'Default', format: 'boolean' },
                    {
                      key: 'fields',
                      label: 'Fields',
                      children: [
                        { key: 'header', label: 'Header' },
                        { key: 'details_1', label: 'Details 1' },
                        { key: 'details_2', label: 'Details 2' },
                        { key: 'details_3', label: 'Details 3' },
                        { key: 'details_4', label: 'Details 4' },
                      ],
                    },
                    { key: 'type', label: 'Type' },
                  ],
                },
                {
                  key: 'layout_item_field_values',
                  label: 'Layout Item Field Values',
                  children: [
                    {
                      key: 'header',
                      label: 'Header',
                      children: fieldDefinitionFields,
                    },
                    {
                      key: 'details_1',
                      label: 'Details 1',
                      children: fieldDefinitionFields,
                    },
                    {
                      key: 'details_2',
                      label: 'Details 2',
                      children: fieldDefinitionFields,
                    },
                  ],
                },
              ],
            },
            { key: 'item_id', label: 'Item ID', format: 'number' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'revision', label: 'Revision', format: 'number' },
            {
              key: 'sharefile_vault_folder_id',
              label: 'ShareFile Vault Folder ID',
            },
            { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
            { key: 'title', label: 'Title' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const podioShareAppOutputSchema: OutputSchema = {
  fields: [{ key: 'share_id', label: 'Share ID', format: 'number' }],
};

export const podioSubscribeOutputSchema: OutputSchema = {
  fields: [
    { key: 'subscription_id', label: 'Subscription ID', format: 'number' },
  ],
};

export const podioUpdateAppOutputSchema: OutputSchema = {
  fields: [
    { key: 'app_id', label: 'App ID', format: 'number' },
    {
      key: 'config',
      label: 'Configuration',
      children: appFullConfigFields,
    },
    { key: 'current_revision', label: 'Current Revision', format: 'number' },
    { key: 'default_view_id', label: 'Default View ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'label',
      listItems: [
        {
          key: 'config',
          label: 'Configuration',
          children: [
            { key: 'default_value', label: 'Default Value' },
            { key: 'delta', label: 'Delta', format: 'number' },
            { key: 'description', label: 'Description' },
            { key: 'hidden', label: 'Hidden', format: 'boolean' },
            {
              key: 'hidden_create_view_edit',
              label: 'Hidden In Create And Edit',
              format: 'boolean',
            },
            { key: 'label', label: 'Label' },
            { key: 'mapping', label: 'Mapping' },
            { key: 'read_only', label: 'Read Only', format: 'boolean' },
            { key: 'required', label: 'Required', format: 'boolean' },
            {
              key: 'settings',
              label: 'Settings',
              children: [
                {
                  key: 'apps',
                  label: 'Apps',
                  labelKey: 'name',
                  listItems: [
                    { key: 'app_id', label: 'App ID', format: 'number' },
                    {
                      key: 'config',
                      label: 'Configuration',
                      children: appIconConfigFields,
                    },
                    {
                      key: 'current_revision',
                      label: 'Current Revision',
                      format: 'number',
                    },
                    { key: 'default_view_id', label: 'Default View ID' },
                    { key: 'icon', label: 'Icon' },
                    { key: 'icon_id', label: 'Icon ID', format: 'number' },
                    { key: 'is_default', label: 'Default', format: 'boolean' },
                    {
                      key: 'item_accounting_info',
                      label: 'Item Usage',
                      children: usageQuotaFields,
                    },
                    { key: 'item_name', label: 'Item Name' },
                    { key: 'link', label: 'Link', format: 'url' },
                    { key: 'link_add', label: 'Add Link', format: 'url' },
                    { key: 'name', label: 'Name' },
                    { key: 'rights', label: 'Rights' },
                    {
                      key: 'sharefile_vault_url',
                      label: 'ShareFile Vault URL',
                    },
                    {
                      key: 'space',
                      label: 'Space',
                      children: spaceBasicFields,
                    },
                    { key: 'space_id', label: 'Space ID', format: 'number' },
                    { key: 'status', label: 'Status' },
                    {
                      key: 'task_accounting_info',
                      label: 'Task Usage',
                      children: userUsageQuotaFields,
                    },
                    { key: 'url_add', label: 'Add URL', format: 'url' },
                    { key: 'url', label: 'URL', format: 'url' },
                    { key: 'url_label', label: 'URL Label' },
                    {
                      key: 'workflow_accounting_info',
                      label: 'Workflow Usage',
                      children: usageQuotaFields,
                    },
                  ],
                },
                { key: 'multiple', label: 'Multiple', format: 'boolean' },
                { key: 'referenceable_types', label: 'Referenceable Types' },
                {
                  key: 'referenced_apps',
                  label: 'Referenced Apps',
                  listItems: [
                    {
                      key: 'app',
                      label: 'App',
                      children: [
                        { key: 'app_id', label: 'App ID', format: 'number' },
                        { key: 'config', label: 'Configuration' },
                        {
                          key: 'current_revision',
                          label: 'Current Revision',
                          format: 'number',
                        },
                        { key: 'default_view_id', label: 'Default View ID' },
                        { key: 'icon', label: 'Icon' },
                        { key: 'icon_id', label: 'Icon ID', format: 'number' },
                        {
                          key: 'is_default',
                          label: 'Default',
                          format: 'boolean',
                        },
                        { key: 'item_accounting_info', label: 'Item Usage' },
                        { key: 'item_name', label: 'Item Name' },
                        { key: 'link', label: 'Link', format: 'url' },
                        { key: 'link_add', label: 'Add Link', format: 'url' },
                        { key: 'name', label: 'Name' },
                        { key: 'rights', label: 'Rights' },
                        {
                          key: 'sharefile_vault_url',
                          label: 'ShareFile Vault URL',
                        },
                        { key: 'space', label: 'Space' },
                        {
                          key: 'space_id',
                          label: 'Space ID',
                          format: 'number',
                        },
                        { key: 'status', label: 'Status' },
                        { key: 'task_accounting_info', label: 'Task Usage' },
                        { key: 'url_add', label: 'Add URL', format: 'url' },
                        { key: 'url', label: 'URL', format: 'url' },
                        { key: 'url_label', label: 'URL Label' },
                        {
                          key: 'workflow_accounting_info',
                          label: 'Workflow Usage',
                        },
                      ],
                    },
                    { key: 'app_id', label: 'App ID', format: 'number' },
                    { key: 'view', label: 'View' },
                    { key: 'view_id', label: 'View ID' },
                  ],
                },
                { key: 'size', label: 'Size' },
                { key: 'format', label: 'Format' },
              ],
            },
            { key: 'unique', label: 'Unique', format: 'boolean' },
            { key: 'visible', label: 'Visible', format: 'boolean' },
          ],
        },
        { key: 'external_id', label: 'External ID' },
        { key: 'field_id', label: 'Field ID', format: 'number' },
        { key: 'label', label: 'Label' },
        { key: 'revision_from', label: 'Revision From', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'integration', label: 'Integration' },
    { key: 'is_default', label: 'Default', format: 'boolean' },
    {
      key: 'item_accounting_info',
      label: 'Item Usage',
      children: usageQuotaFields,
    },
    {
      key: 'layouts',
      label: 'Layouts',
      children: [
        {
          key: 'badge_v2',
          label: 'Badge V2',
          children: badgeNestedFields,
        },
        {
          key: 'badge',
          label: 'Badge',
          children: badgeNestedFields,
        },
        {
          key: 'relationship',
          label: 'Relationship',
          children: [
            { key: 'default', label: 'Default', format: 'boolean' },
            {
              key: 'fields',
              label: 'Fields',
              children: [
                {
                  key: 'header',
                  label: 'Header',
                  children: layoutFieldRefFields,
                },
                {
                  key: 'details_1',
                  label: 'Details 1',
                  children: layoutFieldRefFields,
                },
                {
                  key: 'details_2',
                  label: 'Details 2',
                  children: layoutFieldKeyFields,
                },
                { key: 'details_3', label: 'Details 3' },
                { key: 'details_4', label: 'Details 4' },
              ],
            },
          ],
        },
        {
          key: 'card',
          label: 'Card',
          children: [
            { key: 'default', label: 'Default', format: 'boolean' },
            {
              key: 'fields',
              label: 'Fields',
              children: [
                {
                  key: 'header',
                  label: 'Header',
                  children: layoutFieldRefFields,
                },
                {
                  key: 'content',
                  label: 'Content',
                  children: layoutFieldRefFields,
                },
                {
                  key: 'details_1',
                  label: 'Details 1',
                  children: layoutFieldKeyFields,
                },
                {
                  key: 'details_2',
                  label: 'Details 2',
                  children: layoutFieldKeyFields,
                },
                {
                  key: 'details_3',
                  label: 'Details 3',
                  children: layoutFieldKeyFields,
                },
              ],
            },
          ],
        },
      ],
    },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'link_add', label: 'Add Link', format: 'url' },
    { key: 'original', label: 'Original' },
    { key: 'original_revision', label: 'Original Revision' },
    {
      key: 'owner',
      label: 'Owner',
      children: profileFields,
    },
    { key: 'rights', label: 'Rights' },
    { key: 'sharefile_vault_url', label: 'ShareFile Vault URL' },
    { key: 'space_id', label: 'Space ID', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    {
      key: 'task_accounting_info',
      label: 'Task Usage',
      children: userUsageQuotaFields,
    },
    { key: 'url_add', label: 'Add URL', format: 'url' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'url_label', label: 'URL Label' },
    {
      key: 'workflow_accounting_info',
      label: 'Workflow Usage',
      children: usageQuotaFields,
    },
    { key: 'mailbox', label: 'Mailbox' },
  ],
};

export const podioUpdateCalendarEventOutputSchema: OutputSchema = {
  fields: calendarEventFields,
};

export const podioUpdateItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'revision', label: 'Revision', format: 'number' },
    { key: 'title', label: 'Title' },
  ],
};

export const podioUploadFileOutputSchema: OutputSchema = {
  fields: fileDetailFields,
};

export const podioUploadLinkedAccountFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'created_by',
      label: 'Created By',
      children: userFields,
    },
    { key: 'created_on', label: 'Created', format: 'datetime' },
    {
      key: 'created_via',
      label: 'Created Via',
      children: createdViaFields,
    },
    { key: 'description', label: 'Description' },
    { key: 'external_file_id', label: 'External File ID' },
    { key: 'file_id', label: 'File ID', format: 'number' },
    { key: 'hosted_by', label: 'Hosted By' },
    { key: 'hosted_by_humanized_name', label: 'Hosted By Name' },
    { key: 'link', label: 'Link', format: 'url' },
    { key: 'link_target', label: 'Link Target' },
    { key: 'mimetype', label: 'MIME Type' },
    { key: 'name', label: 'Name' },
    { key: 'perma_link', label: 'Permalink' },
    { key: 'presence', label: 'Presence' },
    { key: 'push', label: 'Push' },
    { key: 'replaces', label: 'Replaces' },
    { key: 'rights', label: 'Rights' },
    { key: 'size', label: 'Size' },
    { key: 'thumbnail_link', label: 'Thumbnail Link' },
    { key: 'uuid_link', label: 'UUID Link' },
  ],
};
