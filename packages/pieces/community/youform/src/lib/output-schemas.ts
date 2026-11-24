import { OutputSchema } from '@activepieces/pieces-framework';

const blockFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Block ID' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'question', label: 'Question' },
  { key: 'description', label: 'Description' },
  { key: 'placeholder', label: 'Placeholder' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'is_email', label: 'Is Email', format: 'boolean' },
  { key: 'validate_email', label: 'Validate Email', format: 'boolean' },
  { key: 'is_last', label: 'Is Last', format: 'boolean' },
  { key: 'cta_text', label: 'Button Text' },
  { key: 'cta_link', label: 'Button Link' },
  { key: 'post_submission_action', label: 'Post Submission Action' },
];

const paginationFields: OutputSchema['fields'] = [
  { key: 'current_page', label: 'Current Page', format: 'number' },
  { key: 'last_page', label: 'Last Page', format: 'number' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'from', label: 'From', format: 'number' },
  { key: 'to', label: 'To', format: 'number' },
  { key: 'next_page_url', label: 'Next Page URL', format: 'url' },
  { key: 'prev_page_url', label: 'Previous Page URL', format: 'url' },
];

export const youformGetFormOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'form',
      label: 'Form',
      children: [
        { key: 'id', label: 'Form ID' },
        { key: 'slug', label: 'Slug' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'type', label: 'Type' },
        { key: 'user_id', label: 'User ID' },
        { key: 'workspace_id', label: 'Workspace ID' },
        {
          key: 'fields',
          label: 'Published Questions',
          children: [
            {
              key: 'blocks',
              label: 'Blocks',
              labelKey: 'title',
              listItems: blockFields,
            },
          ],
        },
        {
          key: 'draft_fields',
          label: 'Draft Questions',
          children: [
            {
              key: 'blocks',
              label: 'Blocks',
              labelKey: 'title',
              listItems: blockFields,
            },
          ],
        },
        { key: 'variables', label: 'Variables' },
        { key: 'hidden_fields', label: 'Hidden Fields' },
        { key: 'messages', label: 'Messages' },
        { key: 'default_language', label: 'Default Language' },
        {
          key: 'settings',
          label: 'Settings',
          children: [
            {
              key: 'reply_to',
              label: 'Reply To',
              children: [{ key: 'block_id', label: 'Block ID' }],
            },
          ],
        },
        { key: 'closed', label: 'Closed' },
        { key: 'close_by_date', label: 'Close By Date', format: 'datetime' },
        {
          key: 'close_by_submissions',
          label: 'Close By Submissions',
          format: 'number',
        },
        { key: 'is_published', label: 'Is Published', format: 'boolean' },
        { key: 'never_published', label: 'Never Published', format: 'boolean' },
        { key: 'published_at', label: 'Published At', format: 'datetime' },
        { key: 'page_url', label: 'Page URL', format: 'url' },
        { key: 'custom_url', label: 'Custom URL', format: 'url' },
        { key: 'webhook_url', label: 'Webhook URL', format: 'url' },
        {
          key: 'submissions_count',
          label: 'Submissions Count',
          format: 'number',
        },
        {
          key: 'analytics',
          label: 'Analytics',
          children: [
            { key: 'views', label: 'Views', format: 'number' },
            { key: 'starts', label: 'Starts', format: 'number' },
            { key: 'submissions', label: 'Submissions', format: 'number' },
            {
              key: 'avg_completion_time',
              label: 'Average Completion Time',
              format: 'number',
            },
          ],
        },
        { key: 'refill_link_enabled', label: 'Refill Link Enabled' },
        {
          key: 'report_sharing_enabled',
          label: 'Report Sharing Enabled',
          format: 'number',
        },
        { key: 'email_notification', label: 'Email Notification' },
        { key: 'google_sheet_id', label: 'Google Sheet ID' },
        { key: 'slack_channel', label: 'Slack Channel' },
        { key: 'notion_database_id', label: 'Notion Database ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
      ],
    },
  ],
};

export const youformListFormsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Forms',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Form ID' },
        { key: 'slug', label: 'Slug' },
        { key: 'name', label: 'Name' },
        { key: 'closed', label: 'Closed' },
        {
          key: 'submissions_count',
          label: 'Submissions Count',
          format: 'number',
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    ...paginationFields,
  ],
};

export const youformListSubmissionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Submissions',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Submission ID' },
        { key: 'uid', label: 'Submission UID' },
        { key: 'form_id', label: 'Form ID' },
        { key: 'data', label: 'Answers', dynamicKey: true },
        { key: 'is_complete', label: 'Is Complete', format: 'number' },
        { key: 'is_test', label: 'Is Test', format: 'number' },
        { key: 'refill_link_enabled', label: 'Refill Link Enabled' },
        { key: 'started_at', label: 'Started At', format: 'datetime' },
        { key: 'completed_at', label: 'Completed At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
        { key: 'session_id', label: 'Session ID' },
        { key: 'country_code', label: 'Country Code' },
        { key: 'device_type', label: 'Device Type' },
        { key: 'platform', label: 'Platform' },
        { key: 'platform_version', label: 'Platform Version' },
        { key: 'browser', label: 'Browser' },
        { key: 'browser_version', label: 'Browser Version' },
        { key: 'user_agent', label: 'User Agent' },
      ],
    },
    ...paginationFields,
  ],
};

export const newSubmissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'event_id', label: 'Event ID' },
    { key: 'event_type', label: 'Event Type' },
    { key: 'form_id', label: 'Form ID' },
    { key: 'form_name', label: 'Form Name' },
    { key: 'submission_id', label: 'Submission ID' },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    { key: 'completed_at', label: 'Completed At', format: 'datetime' },
    { key: 'answers', label: 'Answers by Question', dynamicKey: true },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'question',
      listItems: [
        { key: 'id', label: 'Block ID' },
        { key: 'type', label: 'Type' },
        { key: 'question', label: 'Question' },
        { key: 'description', label: 'Description' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'answer', label: 'Answer' },
        { key: 'answer_text', label: 'Answer Text' },
        { key: 'is_email', label: 'Is Email', format: 'boolean' },
        { key: 'validate_email', label: 'Validate Email', format: 'boolean' },
      ],
    },
  ],
};
