import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const rateFields: Fields = [
  { key: 'float', label: 'Value', format: 'number' },
  { key: 'string', label: 'Formatted' },
];

const subscriberFields: Fields = [
  { key: 'id', label: 'Subscriber ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'sent', label: 'Emails Sent', format: 'number' },
  { key: 'opens_count', label: 'Opens Count', format: 'number' },
  { key: 'clicks_count', label: 'Clicks Count', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', format: 'number' },
  { key: 'click_rate', label: 'Click Rate', format: 'number' },
  { key: 'ip_address', label: 'IP Address' },
  { key: 'subscribed_at', label: 'Subscribed At', format: 'datetime' },
  { key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'opted_in_at', label: 'Opted In At', format: 'datetime' },
  { key: 'optin_ip', label: 'Opt-in IP' },
  { key: 'fields', label: 'Fields', dynamicKey: true },
];

const subscriberWithGroupsFields: Fields = [
  ...subscriberFields,
  { key: 'groups', label: 'Group IDs' },
];

const unsubscribedSubscriberFields: Fields = [
  ...subscriberWithGroupsFields,
  { key: 'unsubscribe_reason', label: 'Unsubscribe Reason' },
];


const webhookSubscriberFields: Fields = [
  ...subscriberFields,
  { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
  { key: 'forget_at', label: 'Forget At', format: 'datetime' },
  { key: 'location', label: 'Location' },
];

const webhookEnvelopeFields: Fields = [
  { key: 'account_id', label: 'Account ID' },
  { key: 'api_version', label: 'API Version' },
];

const groupFields: Fields = [
  { key: 'id', label: 'Group ID' },
  { key: 'name', label: 'Name' },
  { key: 'active_count', label: 'Active Subscribers', format: 'number' },
  { key: 'sent_count', label: 'Emails Sent', format: 'number' },
  { key: 'opens_count', label: 'Opens Count', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', children: rateFields },
  { key: 'clicks_count', label: 'Clicks Count', format: 'number' },
  { key: 'click_rate', label: 'Click Rate', children: rateFields },
  { key: 'unsubscribed_count', label: 'Unsubscribed', format: 'number' },
  { key: 'unconfirmed_count', label: 'Unconfirmed', format: 'number' },
  { key: 'bounced_count', label: 'Bounced', format: 'number' },
  { key: 'junk_count', label: 'Junk', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const linksFields: Fields = [
  { key: 'first', label: 'First Page URL', format: 'url' },
  { key: 'last', label: 'Last Page URL', format: 'url' },
  { key: 'prev', label: 'Previous Page URL', format: 'url' },
  { key: 'next', label: 'Next Page URL', format: 'url' },
];

const cursorMetaFields: Fields = [
  { key: 'path', label: 'Request Path', format: 'url' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'next_cursor', label: 'Next Cursor' },
  { key: 'prev_cursor', label: 'Previous Cursor' },
];

const pageMetaLinkFields: Fields = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'label', label: 'Label' },
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'active', label: 'Active', format: 'boolean' },
];

const pageMetaFields: Fields = [
  { key: 'current_page', label: 'Current Page', format: 'number' },
  { key: 'from', label: 'From', format: 'number' },
  { key: 'to', label: 'To', format: 'number' },
  { key: 'last_page', label: 'Last Page', format: 'number' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'path', label: 'Request Path', format: 'url' },
  { key: 'links', label: 'Page Links', listItems: pageMetaLinkFields, labelKey: 'label' },
];

const single = (fields: Fields): OutputSchema => ({
  fields: [{ key: 'data', label: 'Data', children: fields }],
});

const cursorList = ({ label, fields }: { label: string; fields: Fields }): OutputSchema => ({
  fields: [
    { key: 'data', label, listItems: fields, labelKey: 'id' },
    { key: 'links', label: 'Links', children: linksFields },
    { key: 'meta', label: 'Meta', children: cursorMetaFields },
  ],
});

const pageList = ({ label, fields }: { label: string; fields: Fields }): OutputSchema => ({
  fields: [
    { key: 'data', label, listItems: fields, labelKey: 'name' },
    { key: 'links', label: 'Links', children: linksFields },
    { key: 'meta', label: 'Meta', children: pageMetaFields },
  ],
});

const humanize = (key: string): string =>
  key
    .split('_')
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');

const named = (keys: string[]): Fields => keys.map((key) => ({ key, label: humanize(key) }));

const rates = (keys: string[]): Fields => keys.map((key) => ({ key, label: humanize(key), children: rateFields }));

const segmentFields: Fields = [
  { key: 'id', label: 'Segment ID' },
  { key: 'name', label: 'Name' },
  { key: 'total', label: 'Total Subscribers', format: 'number' },
  { key: 'automations_using_segment_count', label: 'Automations Using Segment', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', children: rateFields },
  { key: 'click_rate', label: 'Click Rate', children: rateFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const fieldFields: Fields = [
  { key: 'id', label: 'Field ID' },
  { key: 'name', label: 'Name' },
  { key: 'key', label: 'Key' },
  { key: 'type', label: 'Type' },
  { key: 'is_default', label: 'Default Field', format: 'boolean' },
];

const listedFieldFields: Fields = [
  ...fieldFields,
  { key: 'used_in_automations', label: 'Used In Automations', format: 'boolean' },
];

const automationStatsFields: Fields = [
  ...named([
    'completed_subscribers_count',
    'subscribers_in_queue_count',
    'sent',
    'opens_count',
    'unique_opens_count',
    'clicks_count',
    'unique_clicks_count',
    'unsubscribes_count',
    'spam_count',
    'hard_bounces_count',
    'soft_bounces_count',
    'social_interactions_count',
  ]),
  ...rates([
    'bounce_rate',
    'click_to_open_rate',
    'open_rate',
    'click_rate',
    'unsubscribe_rate',
    'spam_rate',
    'hard_bounce_rate',
    'soft_bounce_rate',
    'forward_rate',
    'social_interaction_rate',
  ]),
];

const automationFields: Fields = [
  { key: 'id', label: 'Automation ID' },
  { key: 'name', label: 'Name' },
  { key: 'enabled', label: 'Enabled', format: 'boolean' },
  { key: 'trigger_data', label: 'Trigger Data', children: named(['track_ecommerce', 'broken_workflow', 'complete_workflow']) },
  { key: 'steps', label: 'Steps' },
  { key: 'triggers', label: 'Triggers' },
  { key: 'complete', label: 'Complete', format: 'boolean' },
  { key: 'broken', label: 'Broken', format: 'boolean' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'emails_count', label: 'Emails Count', format: 'number' },
  { key: 'first_email_screenshot_url', label: 'First Email Screenshot URL', format: 'url' },
  { key: 'stats', label: 'Stats', children: automationStatsFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'has_banned_content', label: 'Has Banned Content', format: 'boolean' },
  { key: 'building_in_progress', label: 'Building In Progress', format: 'boolean' },
  { key: 'automation_template_id', label: 'Template ID' },
  { key: 'automation_template_name', label: 'Template Name' },
  { key: 'classic_sync_in_progress', label: 'Classic Sync In Progress', format: 'boolean' },
  { key: 'classic_sync_activate_after', label: 'Classic Sync Activate After' },
];

const automationDetailFields: Fields = [
  ...automationFields.filter((field) => field.key !== 'first_email_screenshot_url'),
  { key: 'heylite_inactive_count', label: 'Heylite Inactive Count', format: 'number' },
  { key: 'heylite_recommendation_id', label: 'Heylite Recommendation ID' },
];

const createdAutomationFields: Fields = automationFields.filter(
  (field) => field.key !== 'first_email_screenshot_url' && field.key !== 'triggers',
);

const languageFields: Fields = [
  { key: 'id', label: 'Language ID' },
  { key: 'shortcode', label: 'Shortcode' },
  { key: 'iso639', label: 'ISO 639' },
  { key: 'name', label: 'Name' },
  { key: 'direction', label: 'Direction' },
];

const campaignEmailStatsFields: Fields = [
  ...named([
    'sent',
    'opens_count',
    'clicks_count',
    'unsubscribes_count',
    'spam_count',
    'hard_bounces_count',
    'soft_bounces_count',
    'deliveries_count',
    'forwards_count',
    'social_interactions_count',
  ]),
  ...rates([
    'open_rate',
    'click_rate',
    'unsubscribe_rate',
    'spam_rate',
    'hard_bounce_rate',
    'soft_bounce_rate',
    'delivery_rate',
    'forward_rate',
    'social_interaction_rate',
    'click_to_open_rate',
  ]),
];

const campaignEmailFields: Fields = [
  ...named([
    'id',
    'account_id',
    'emailable_id',
    'emailable_type',
    'type',
    'from',
    'from_name',
    'reply_to',
    'name',
    'subject',
    'content',
    'plain_text',
    'screenshot_url',
    'uses_new_builder',
    'uses_landscape_screenshot',
    'generate_screenshot_timestamp',
    'is_building_content',
    'preview_url',
    'report_preview_url',
    'created_at',
    'updated_at',
    'is_designed',
    'language_id',
    'is_winner',
    'send_after',
    'track_opens',
    'uses_survey',
    'uses_quiz',
    'preheader',
  ]),
  { key: 'language', label: 'Language', children: languageFields },
  { key: 'stats', label: 'Stats', children: campaignEmailStatsFields },
];

const filterGroupFields: Fields = [
  ...groupFields.map((field) => (field.children ? { key: field.key, label: field.label } : field)),
  ...named(['account_id', 'updated_at', 'deleted_at', 'serial_no']),
];

const campaignWriteFields: Fields = [
  ...named([
    'id',
    'account_id',
    'name',
    'type',
    'status',
    'missing_data',
    'filter',
    'filter_for_humans',
    'delivery_schedule',
    'language_id',
    'created_at',
    'updated_at',
    'scheduled_for',
    'queued_at',
    'started_at',
    'finished_at',
    'stopped_at',
    'default_email_id',
    'used_in_automations',
    'type_for_humans',
    'is_stopped',
    'has_winner',
    'winner_version_for_human',
    'winner_sending_time_for_humans',
    'winner_selected_manually_at',
    'uses_ecommerce',
    'ecommerce_stats',
    'uses_survey',
    'is_smart_sending_index_option_finished',
    'is_applied_for_smart_sending_index_option',
    'warnings',
    'recipients_count',
    'next_step',
    'is_currently_sending_out',
    'can_be_copied',
    'has_basic_filter',
    'is_eligible_for_sending',
    'subscriber_import_limit_exceeded',
    'needs_repair',
  ]),
  { key: 'settings', label: 'Settings', children: named(['track_opens', 'use_google_analytics', 'ecommerce_tracking']) },
  { key: 'language', label: 'Language', children: languageFields },
  { key: 'can', label: 'Permissions', children: named(['update', 'delete', 'send', 'copy', 'resend']) },
  { key: 'emails', label: 'Emails', listItems: campaignEmailFields, labelKey: 'subject' },
  {
    key: 'basic_filter_for_humans',
    label: 'Audience',
    children: [
      { key: 'all_active_subscribers', label: 'All Active Subscribers' },
      { key: 'included_groups', label: 'Included Groups', listItems: filterGroupFields, labelKey: 'name' },
      { key: 'excluded_groups', label: 'Excluded Groups' },
      { key: 'included_segments', label: 'Included Segments' },
      { key: 'excluded_segments', label: 'Excluded Segments' },
    ],
  },
];

const campaignFields: Fields = [
  ...campaignWriteFields.map((field) =>
    field.key === 'emails'
      ? { ...field, listItems: [...campaignEmailFields, { key: 'click_map', label: 'Click Map' }] }
      : field,
  ),
  { key: 'can_be_scheduled', label: 'Can Be Scheduled', format: 'boolean' },
  { key: 'cannot_be_scheduled_reason', label: 'Cannot Be Scheduled Reason' },
];

const formFields: Fields = [
  { key: 'id', label: 'Form ID' },
  { key: 'type', label: 'Type' },
  { key: 'slug', label: 'Slug' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'conversions_count', label: 'Conversions', format: 'number' },
  { key: 'conversion_rate', label: 'Conversion Rate', children: rateFields },
  { key: 'opens_count', label: 'Opens Count', format: 'number' },
  { key: 'settings', label: 'Settings' },
  { key: 'last_registration_at', label: 'Last Registration At', format: 'datetime' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'is_broken', label: 'Broken', format: 'boolean' },
  { key: 'has_content', label: 'Has Content', format: 'boolean' },
  { key: 'used_in_automations', label: 'Used In Automations', format: 'boolean' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'double_optin', label: 'Double Opt-in', format: 'boolean' },
  { key: 'screenshot_url', label: 'Screenshot URL', format: 'url' },
  { key: 'share_url', label: 'Share URL', format: 'url' },
  { key: 'groups', label: 'Groups', listItems: groupFields, labelKey: 'name' },
  { key: 'can', label: 'Permissions', children: named(['update']) },
  { key: 'conversion_rate_including_children', label: 'Conversion Rate Including Children', children: rateFields },
  ...named([
    'account_id',
    'original_name',
    'parent_id',
    'children',
    'has_missing_groups',
    'split_test_enabled',
    'split_test_finished',
    'has_split_tests',
    'split_percentage',
    'warning_messages',
    'uses_new_builder',
    'uses_survey',
    'can_choose_template',
    'is_split_test_winner',
    'analytics_reset_at',
    'conversions_count_including_children',
    'opens_count_including_children',
  ]),
];

const formDetailFields: Fields = formFields.map((field) =>
  field.key === 'settings' ? { ...field, children: named(['double_optin', 'groot_id', 'automated_content_check_performed']) } : field,
);

const listedFormFields: Fields = formFields.map((field) =>
  field.key === 'settings' ? { ...field, children: named([
    'double_optin',
    'form_type',
    'groot_id',
    'automated_content_check_performed',
    'is_first_form_with_content',
    'needs_content_refresh',
  ]) } : field,
);

const webhookFields: Fields = [
  { key: 'id', label: 'Webhook ID' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'events', label: 'Events' },
  { key: 'enabled', label: 'Enabled', format: 'boolean' },
  { key: 'batchable', label: 'Batchable', format: 'boolean' },
  { key: 'is_blocked', label: 'Blocked', format: 'boolean' },
  { key: 'last_fired_at', label: 'Last Fired At', format: 'datetime' },
  { key: 'response_code', label: 'Last Response Code' },
  { key: 'version', label: 'Version' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const subscriberActivityFields: Fields = [
  { key: 'id', label: 'Activity ID' },
  { key: 'log_name', label: 'Activity Type' },
  { key: 'subject_id', label: 'Subject ID' },
  { key: 'subject_type', label: 'Subject Type' },
  { key: 'properties', label: 'Properties', children: [
    { key: 'group_id', label: 'Group ID' },
    { key: 'group_name', label: 'Group Name' },
  ] },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const automationActivityFields: Fields = [
  { key: 'id', label: 'Activity ID' },
  { key: 'status', label: 'Status' },
  { key: 'subscriber', label: 'Subscriber' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'scheduled_for', label: 'Scheduled For', format: 'datetime' },
  { key: 'reason', label: 'Reason' },
  { key: 'reason_description', label: 'Reason Description' },
];

const importFields: Fields = [
  ...named([
    'id',
    'account_id',
    'total',
    'processed',
    'imported',
    'updated',
    'errored',
    'percent',
    'done',
    'invalid',
    'invalid_count',
    'mistyped',
    'mistyped_count',
    'changed',
    'changed_count',
    'unchanged',
    'unchanged_count',
    'unsubscribed',
    'unsubscribed_count',
    'role_based',
    'role_based_count',
    'suspicious_format',
    'suspicious_format_count',
    'duplicate',
    'duplicate_count',
    'subscriber_limit',
    'subscriber_limit_count',
    'banned_import_emails_count',
    'updated_at',
    'undone_at',
    'is_stopped_due_to_free_account_limit_exceeded',
    'stopped_at',
    'undo_started_at',
    'finished_at',
  ]),
];

const timezoneFields: Fields = [
  { key: 'id', label: 'Timezone ID' },
  { key: 'name', label: 'Name' },
  { key: 'name_for_humans', label: 'Display Name' },
  { key: 'offset_name', label: 'Offset Name' },
  { key: 'offset', label: 'Offset', format: 'number' },
];

const subscriberWithGroupListFields: Fields = [
  ...subscriberFields,
  { key: 'location', label: 'Location' },
  { key: 'groups', label: 'Groups', listItems: groupFields, labelKey: 'name' },
];

const forgottenSubscriberFields: Fields = [
  ...webhookSubscriberFields,
  { key: 'groups', label: 'Group IDs' },
];

const plainList = ({ label, fields, labelKey = 'name' }: { label: string; fields: Fields; labelKey?: string }): OutputSchema => ({
  fields: [{ key: 'data', label, listItems: fields, labelKey }],
});

const withAggregations = ({ schema, keys }: { schema: OutputSchema; keys: string[] }): OutputSchema => ({
  fields: schema.fields.map((field) =>
    field.key === 'meta'
      ? { ...field, children: [...(field.children ?? []), { key: 'aggregations', label: 'Aggregations', children: named(keys) }] }
      : field,
  ),
});

const deleted = ({ idKey, idLabel }: { idKey: string; idLabel: string }): OutputSchema => ({
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: idKey, label: idLabel },
  ],
});

export const findSubscriberOutputSchema: OutputSchema = single(subscriberWithGroupsFields);
export const addOrUpdateSubscriberOutputSchema: OutputSchema = single(subscriberWithGroupsFields);
export const unsubscribeSubscriberOutputSchema: OutputSchema = single(unsubscribedSubscriberFields);
export const listSubscribersOutputSchema: OutputSchema = cursorList({ label: 'Subscribers', fields: subscriberFields });

export const addSubscriberToGroupOutputSchema: OutputSchema = single(groupFields);
export const createGroupOutputSchema: OutputSchema = single(groupFields);
export const listGroupsOutputSchema: OutputSchema = pageList({ label: 'Groups', fields: groupFields });
export const listGroupSubscribersOutputSchema: OutputSchema = cursorList({ label: 'Subscribers', fields: subscriberFields });

export const deleteSubscriberOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'subscriberId', label: 'Subscriber ID' },
  ],
};

export const subscriberEventTriggerOutputSchema: OutputSchema = {
  fields: [
    ...webhookSubscriberFields,
    { key: 'event', label: 'Event' },
    ...webhookEnvelopeFields,
  ],
};

export const subscriberAddedToGroupTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Event' },
    { key: 'subscriber', label: 'Subscriber', children: webhookSubscriberFields },
    { key: 'group', label: 'Group', children: [
      { key: 'id', label: 'Group ID' },
      { key: 'name', label: 'Name' },
    ] },
    ...webhookEnvelopeFields,
  ],
};

export const updateSubscriberOutputSchema: OutputSchema = { fields: subscriberWithGroupListFields };
export const forgetSubscriberOutputSchema: OutputSchema = { fields: forgottenSubscriberFields };
export const subscriberActivityOutputSchema: OutputSchema = plainList({ label: 'Activity', fields: subscriberActivityFields, labelKey: 'log_name' });
export const countSubscribersOutputSchema: OutputSchema = {
  fields: [{ key: 'total', label: 'Total Subscribers', format: 'number' }],
};
export const importSubscribersOutputSchema: OutputSchema = {
  fields: [
    { key: 'import_id', label: 'Import ID' },
    { key: 'import_progress_url', label: 'Import Progress URL', format: 'url' },
  ],
};
export const importStatusOutputSchema: OutputSchema = { fields: importFields };
export const findGroupsByNameOutputSchema: OutputSchema = pageList({ label: 'Groups', fields: groupFields });
export const groupOutputSchema: OutputSchema = { fields: groupFields };
export const deleteGroupOutputSchema: OutputSchema = deleted({ idKey: 'group_id', idLabel: 'Group ID' });
export const listSegmentsOutputSchema: OutputSchema = pageList({ label: 'Segments', fields: segmentFields });
export const listSegmentSubscribersOutputSchema: OutputSchema = cursorList({ label: 'Subscribers', fields: [...subscriberFields, { key: 'groups', label: 'Groups' }] });
export const segmentOutputSchema: OutputSchema = { fields: segmentFields.filter((field) => field.key !== 'automations_using_segment_count') };
export const deleteSegmentOutputSchema: OutputSchema = deleted({ idKey: 'segment_id', idLabel: 'Segment ID' });
export const listFieldsOutputSchema: OutputSchema = pageList({ label: 'Fields', fields: listedFieldFields });
export const fieldOutputSchema: OutputSchema = { fields: fieldFields };
export const deleteFieldOutputSchema: OutputSchema = deleted({ idKey: 'field_id', idLabel: 'Field ID' });
export const listAutomationsOutputSchema: OutputSchema = withAggregations({ schema: pageList({ label: 'Automations', fields: automationFields }), keys: ['workflows', 'drafts', 'unsync', 'all'] });
export const automationOutputSchema: OutputSchema = { fields: automationDetailFields };
export const automationActivityOutputSchema: OutputSchema = pageList({ label: 'Activity', fields: automationActivityFields });
export const deleteAutomationOutputSchema: OutputSchema = deleted({ idKey: 'automation_id', idLabel: 'Automation ID' });
export const listCampaignsOutputSchema: OutputSchema = withAggregations({ schema: pageList({ label: 'Campaigns', fields: campaignFields }), keys: ['all', 'draft', 'ready', 'sent'] });
export const campaignOutputSchema: OutputSchema = { fields: campaignFields };
export const campaignWriteOutputSchema: OutputSchema = { fields: campaignWriteFields };
export const createAutomationOutputSchema: OutputSchema = { fields: createdAutomationFields };
export const deleteCampaignOutputSchema: OutputSchema = deleted({ idKey: 'campaign_id', idLabel: 'Campaign ID' });
export const listCampaignLanguagesOutputSchema: OutputSchema = plainList({ label: 'Languages', fields: languageFields });
export const listFormsOutputSchema: OutputSchema = withAggregations({ schema: pageList({ label: 'Forms', fields: listedFormFields }), keys: ['popup', 'embedded', 'promotion'] });
export const formOutputSchema: OutputSchema = { fields: formDetailFields };
export const listFormSubscribersOutputSchema: OutputSchema = cursorList({ label: 'Subscribers', fields: subscriberFields });
export const listWebhooksOutputSchema: OutputSchema = pageList({ label: 'Webhooks', fields: webhookFields });
export const webhookOutputSchema: OutputSchema = { fields: webhookFields };
export const deleteWebhookOutputSchema: OutputSchema = deleted({ idKey: 'webhook_id', idLabel: 'Webhook ID' });
export const listTimezonesOutputSchema: OutputSchema = plainList({ label: 'Timezones', fields: timezoneFields });
