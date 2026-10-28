import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const boxFields: OutputSchemaField[] = [
  { key: 'box_key', label: 'Box Key' },
  { key: 'name', label: 'Name' },
  { key: 'pipeline_key', label: 'Pipeline Key' },
  { key: 'stage_key', label: 'Stage Key' },
  { key: 'creator_key', label: 'Creator Key' },
  { key: 'notes', label: 'Notes' },
  { key: 'follower_count', label: 'Follower Count', format: 'number' },
  { key: 'comment_count', label: 'Comment Count', format: 'number' },
  { key: 'task_total', label: 'Task Total', format: 'number' },
  { key: 'file_count', label: 'File Count', format: 'number' },
  { key: 'gmail_thread_count', label: 'Gmail Thread Count', format: 'number' },
  { key: 'creation_timestamp', label: 'Created At', format: 'datetime' },
  { key: 'last_updated_timestamp', label: 'Last Updated At', format: 'datetime' },
  { key: 'followers', label: 'Follower Keys' },
  { key: 'fields_json', label: 'Custom Fields (JSON)' },
];

const taskFields: OutputSchemaField[] = [
  { key: 'task_key', label: 'Task Key' },
  { key: 'box_key', label: 'Box Key' },
  { key: 'text', label: 'Text' },
  { key: 'status', label: 'Status' },
  { key: 'due_date_epoch_ms', label: 'Due Date', format: 'datetime' },
  { key: 'creator_key', label: 'Creator Key' },
  { key: 'creation_date_epoch_ms', label: 'Created At', format: 'datetime' },
  { key: 'last_updated_date_epoch_ms', label: 'Last Updated At', format: 'datetime' },
  { key: 'assigned_to_emails', label: 'Assigned To (Emails)' },
];

const boxSummaryFields: OutputSchemaField[] = [
  { key: 'box_key', label: 'Box Key' },
  { key: 'name', label: 'Name' },
  { key: 'pipeline_key', label: 'Pipeline Key' },
  { key: 'stage_key', label: 'Stage Key' },
  { key: 'last_updated_timestamp_epoch_ms', label: 'Last Updated At', format: 'datetime' },
];

const webhookBoxFields: OutputSchemaField[] = [
  { key: 'boxKey', label: 'Box Key' },
  { key: 'name', label: 'Name' },
  { key: 'pipelineKey', label: 'Pipeline Key' },
  { key: 'stageKey', label: 'Stage Key' },
  { key: 'creatorKey', label: 'Creator Key' },
  { key: 'creationTimestamp', label: 'Created At', format: 'datetime' },
  { key: 'lastUpdatedTimestamp', label: 'Last Updated At', format: 'datetime' },
];

const webhookTaskFields: OutputSchemaField[] = [
  { key: 'key', label: 'Task Key' },
  { key: 'boxKey', label: 'Box Key' },
  { key: 'text', label: 'Text' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date', format: 'datetime' },
  { key: 'creatorKey', label: 'Creator Key' },
  { key: 'creationDate', label: 'Created At', format: 'datetime' },
];

const webhookContactFields: OutputSchemaField[] = [
  { key: 'key', label: 'Contact Key' },
  { key: 'givenName', label: 'First Name' },
  { key: 'familyName', label: 'Last Name' },
  { key: 'title', label: 'Title' },
  { key: 'emailAddresses', label: 'Email Addresses' },
  { key: 'creationDate', label: 'Created At', format: 'datetime' },
  { key: 'lastSavedTimestamp', label: 'Last Saved At', format: 'datetime' },
];

export const boxOutputSchema: OutputSchema = { fields: boxFields };

export const boxListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'boxes', label: 'Boxes', value: '', listItems: boxFields, labelKey: 'name' }],
};

export const boxSearchOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'boxes', label: 'Boxes', value: '', listItems: boxSummaryFields, labelKey: 'name' },
  ],
};

export const taskOutputSchema: OutputSchema = { fields: taskFields };

export const taskListOutputSchema: OutputSchema = {
  itemLabel: '{text}',
  fields: [{ key: 'tasks', label: 'Tasks', value: '', listItems: taskFields, labelKey: 'text' }],
};

export const stageOutputSchema: OutputSchema = {
  fields: [
    { key: 'stage_key', label: 'Stage Key' },
    { key: 'name', label: 'Name' },
  ],
};

export const stageListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'stages',
      label: 'Stages',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'stage_key', label: 'Stage Key' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const pipelineListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'pipelines',
      label: 'Pipelines',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'pipeline_key', label: 'Pipeline Key' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'stage_count', label: 'Stage Count', format: 'number' },
        { key: 'field_count', label: 'Field Count', format: 'number' },
        { key: 'creation_timestamp', label: 'Created At', format: 'datetime' },
        { key: 'last_updated_timestamp', label: 'Last Updated At', format: 'datetime' },
      ],
    },
  ],
};

export const teamListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'teams',
      label: 'Teams',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'team_key', label: 'Team Key' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const pipelineFieldListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'fields',
      label: 'Fields',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'field_key', label: 'Field Key' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        {
          key: 'dropdown_options',
          label: 'Dropdown Options',
          labelKey: 'name',
          listItems: [
            { key: 'key', label: 'Option Key' },
            { key: 'name', label: 'Option Name' },
          ],
        },
      ],
    },
  ],
};

export const commentOutputSchema: OutputSchema = {
  fields: [
    { key: 'comment_key', label: 'Comment Key' },
    { key: 'box_key', label: 'Box Key' },
    { key: 'message', label: 'Message' },
    { key: 'creator_key', label: 'Creator Key' },
    { key: 'creation_date_epoch_ms', label: 'Created At', format: 'datetime' },
  ],
};

export const contactOutputSchema: OutputSchema = {
  fields: [
    { key: 'contact_key', label: 'Contact Key' },
    { key: 'given_name', label: 'First Name' },
    { key: 'family_name', label: 'Last Name' },
    { key: 'title', label: 'Title' },
    { key: 'email_addresses', label: 'Email Addresses' },
    { key: 'phone_numbers', label: 'Phone Numbers' },
    { key: 'addresses', label: 'Addresses' },
    { key: 'twitter_handle', label: 'Twitter Handle' },
    { key: 'facebook_handle', label: 'Facebook Handle' },
    { key: 'linkedin_handle', label: 'LinkedIn Handle' },
    { key: 'photo_url', label: 'Photo URL', format: 'image' },
    { key: 'other', label: 'Notes' },
    { key: 'creation_date_epoch_ms', label: 'Created At', format: 'datetime' },
    { key: 'last_saved_timestamp_epoch_ms', label: 'Last Saved At', format: 'datetime' },
  ],
};

export const organizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'organization_key', label: 'Organization Key' },
    { key: 'name', label: 'Name' },
    { key: 'domains', label: 'Domains' },
    { key: 'industry', label: 'Industry' },
    { key: 'employee_count', label: 'Employee Count', format: 'number' },
    { key: 'phone_numbers', label: 'Phone Numbers' },
    { key: 'addresses', label: 'Addresses' },
    { key: 'twitter_handle', label: 'Twitter Handle' },
    { key: 'facebook_handle', label: 'Facebook Handle' },
    { key: 'linkedin_handle', label: 'LinkedIn Handle' },
    { key: 'logo_url', label: 'Logo URL', format: 'image' },
    { key: 'description', label: 'Description' },
    { key: 'creation_date_epoch_ms', label: 'Created At', format: 'datetime' },
    { key: 'last_saved_timestamp_epoch_ms', label: 'Last Saved At', format: 'datetime' },
  ],
};

export const userOutputSchema: OutputSchema = {
  fields: [
    { key: 'user_key', label: 'User Key' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'lowercase_email', label: 'Lowercase Email', format: 'email' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'is_oauth_complete', label: 'OAuth Complete', format: 'boolean' },
    { key: 'creation_timestamp_epoch_ms', label: 'Created At', format: 'datetime' },
    { key: 'last_updated_timestamp_epoch_ms', label: 'Last Updated At', format: 'datetime' },
    { key: 'last_seen_timestamp_epoch_ms', label: 'Last Seen At', format: 'datetime' },
  ],
};

export const boxWebhookOutputSchema: OutputSchema = { fields: webhookBoxFields };

export const boxStageChangedWebhookOutputSchema: OutputSchema = {
  fields: [
    ...webhookBoxFields,
    { key: 'previousStageKey', label: 'Previous Stage Key' },
  ],
};

export const boxPipelineChangedWebhookOutputSchema: OutputSchema = {
  fields: [
    ...webhookBoxFields,
    { key: 'previousPipelineKey', label: 'Previous Pipeline Key' },
  ],
};

export const commentWebhookOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'Comment Key' },
    { key: 'boxKey', label: 'Box Key' },
    { key: 'message', label: 'Message' },
    { key: 'creatorKey', label: 'Creator Key' },
    { key: 'creationDate', label: 'Created At', format: 'datetime' },
  ],
};

export const meetingWebhookOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'Meeting Key' },
    { key: 'boxKey', label: 'Box Key' },
    { key: 'name', label: 'Name' },
    { key: 'notes', label: 'Notes' },
    { key: 'timestamp', label: 'Meeting Time', format: 'datetime' },
  ],
};

export const taskWebhookOutputSchema: OutputSchema = { fields: webhookTaskFields };

export const taskCompletedWebhookOutputSchema: OutputSchema = {
  fields: [
    ...webhookTaskFields,
    { key: 'completedAt', label: 'Completed At', format: 'datetime' },
  ],
};

export const contactWebhookOutputSchema: OutputSchema = { fields: webhookContactFields };
