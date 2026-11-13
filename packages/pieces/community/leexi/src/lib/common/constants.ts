import { OutputSchemaField } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://public-api.leexi.ai/v1';
export const MAX_FETCH_CALL_UUIDS = 20;
export const MAX_FETCH_CALL_UUIDS_WITH_INCLUDE = 5;
export const MAX_TRIGGER_PAGES = 20;

const userRefFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'User UUID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'active', label: 'Active', format: 'boolean' },
];

const customerFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Customer UUID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone_number', label: 'Phone Number' },
];

const speakerFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Speaker UUID' },
  { key: 'index', label: 'Index', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'email_address', label: 'Email', format: 'email' },
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'is_user', label: 'Is Leexi User', format: 'boolean' },
];

const taskFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Task UUID' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'done', label: 'Done', format: 'boolean' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const conversationTypeFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Conversation Type UUID' },
  { key: 'slug', label: 'Slug' },
  { key: 'active', label: 'Active', format: 'boolean' },
];

const callSummary: OutputSchemaField[] = [
  { key: 'uuid', label: 'Call UUID' },
  { key: 'title', label: 'Title' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'performed_at', label: 'Performed At', format: 'datetime' },
  { key: 'duration', label: 'Duration (seconds)', format: 'number' },
  { key: 'direction', label: 'Direction' },
  { key: 'locale', label: 'Locale' },
  { key: 'source', label: 'Source' },
  { key: 'leexi_url', label: 'Leexi URL', format: 'url' },
  { key: 'conversation_type', label: 'Conversation Type', children: conversationTypeFields },
  { key: 'owner', label: 'Owner', children: userRefFields },
  { key: 'participating_users', label: 'Participating Users', listItems: userRefFields, labelKey: 'name' },
  { key: 'customers', label: 'Customers', listItems: customerFields, labelKey: 'name' },
];

const callDetail: OutputSchemaField[] = [
  ...callSummary,
  { key: 'description', label: 'Description' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'is_video', label: 'Is Video', format: 'boolean' },
  { key: 'source_id', label: 'Source ID' },
  { key: 'summary', label: 'Summary' },
  { key: 'simple_transcript', label: 'Transcript' },
  { key: 'recording_url', label: 'Recording URL', format: 'url', description: 'Signed download link that expires after 1 hour.' },
  { key: 'transcript_url', label: 'Transcript URL', format: 'url', description: 'Signed download link that expires after 1 hour.' },
  { key: 'customer_email_addresses', label: 'Customer Email Addresses' },
  { key: 'customer_phone_numbers', label: 'Customer Phone Numbers' },
  { key: 'speakers', label: 'Speakers', listItems: speakerFields, labelKey: 'name' },
  { key: 'tasks', label: 'Tasks', listItems: taskFields, labelKey: 'subject' },
  { key: 'prompts', label: 'AI Notes (Prompts)' },
  { key: 'chapters', label: 'Chapters' },
  { key: 'scorecards', label: 'Scorecards' },
];

const pagination: OutputSchemaField[] = [
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'items', label: 'Items per Page', format: 'number' },
  { key: 'count', label: 'Total Count', format: 'number' },
  { key: 'pages', label: 'Total Pages', format: 'number' },
];

const user: OutputSchemaField[] = [
  { key: 'uuid', label: 'User UUID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'license', label: 'License' },
  { key: 'roles', label: 'Roles' },
  { key: 'team', label: 'Team', children: [
    { key: 'uuid', label: 'Team UUID' },
    { key: 'name', label: 'Team Name' },
    { key: 'active', label: 'Team Active', format: 'boolean' },
  ] },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const meetingEvent: OutputSchemaField[] = [
  { key: 'uuid', label: 'Meeting Event UUID' },
  { key: 'title', label: 'Title' },
  { key: 'organizer', label: 'Organizer' },
  { key: 'attendees', label: 'Attendees' },
  { key: 'meeting_url', label: 'Meeting URL', format: 'url' },
  { key: 'meeting_provider', label: 'Meeting Provider' },
  { key: 'internal', label: 'Internal', format: 'boolean' },
  { key: 'direction', label: 'Direction' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'end_time', label: 'End Time', format: 'datetime' },
  { key: 'description', label: 'Description' },
  { key: 'owned', label: 'Owned', format: 'boolean' },
  { key: 'to_record', label: 'To Record', format: 'boolean' },
  { key: 'bot_scheduled', label: 'Bot Scheduled', format: 'boolean' },
  { key: 'bot_running', label: 'Bot Running', format: 'boolean' },
  { key: 'origin', label: 'Origin' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const leexiOutputFields = {
  userRef: userRefFields,
  speaker: speakerFields,
  task: taskFields,
  callSummary,
  callDetail,
  pagination,
  user,
  meetingEvent,
};
