import { OutputSchema } from '@activepieces/pieces-framework';

const currentTeamFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Team ID', format: 'number' },
  { key: 'user_id', label: 'Owner User ID', format: 'number' },
  { key: 'name', label: 'Team Name' },
];

const promptHeadBranchFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Branch ID', format: 'number' },
  { key: 'name', label: 'Branch Name' },
  { key: 'protected', label: 'Protected', format: 'boolean' },
];

const promptHeadConfigurationFields: OutputSchema['fields'] = [
  { key: 'max_tokens', label: 'Max Tokens', format: 'number' },
  { key: 'temperature', label: 'Temperature', format: 'number' },
  { key: 'top_p', label: 'Top P', format: 'number' },
  { key: 'top_k', label: 'Top K', format: 'number' },
  { key: 'presence_penalty', label: 'Presence Penalty', format: 'number' },
  { key: 'frequency_penalty', label: 'Frequency Penalty', format: 'number' },
  { key: 'response_format', label: 'Response Format' },
  { key: 'reasoning_effort', label: 'Reasoning Effort' },
  { key: 'extended_thinking', label: 'Extended Thinking', format: 'boolean' },
];

const promptFormattedRequestFields: OutputSchema['fields'] = [
  { key: 'model', label: 'Model' },
  {
    key: 'messages',
    label: 'Messages',
    labelKey: 'role',
    listItems: [
      { key: 'role', label: 'Role' },
      { key: 'content', label: 'Content' },
    ],
  },
  { key: 'max_tokens', label: 'Max Tokens', format: 'number' },
  { key: 'temperature', label: 'Temperature', format: 'number' },
  { key: 'top_p', label: 'Top P', format: 'number' },
  {
    key: 'response_format',
    label: 'Response Format',
    children: [{ key: 'type', label: 'Type' }],
  },
];

const promptHeadProjectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Project Name' },
  { key: 'description', label: 'Description' },
];

const promptHeadFields: OutputSchema['fields'] = [
  { key: 'provider', label: 'Provider' },
  { key: 'model', label: 'Model' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'system_message', label: 'System Message' },
  { key: 'formatted_request', label: 'Formatted Request', children: promptFormattedRequestFields },
  { key: 'hash', label: 'Hash' },
  { key: 'commit_title', label: 'Commit Title' },
  { key: 'commit_description', label: 'Commit Description' },
  {
    key: 'variables',
    label: 'Variables',
    children: [
      { key: 'system_message', label: 'System Message Variables' },
      { key: 'prompt', label: 'Prompt Variables' },
    ],
  },
  { key: 'branch', label: 'Branch', children: promptHeadBranchFields },
  { key: 'configuration', label: 'Configuration', children: promptHeadConfigurationFields },
];

export const getCurrentAccountActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Account ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'avatar', label: 'Avatar', format: 'image' },
    { key: 'current_team_id', label: 'Current Team ID', format: 'number' },
    { key: 'current_project_id', label: 'Current Project ID', format: 'number' },
    { key: 'current_prompt_id', label: 'Current Prompt ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'current_team', label: 'Current Team', children: currentTeamFields },
  ],
};

export const listProjectsActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'projects',
      label: 'Projects',
      value: '',
      listItems: [
        { key: 'id', label: 'Project ID', format: 'number' },
        { key: 'name', label: 'Project Name' },
        { key: 'description', label: 'Description' },
        { key: 'head', label: 'Head', children: promptHeadFields },
        { key: 'groups', label: 'Groups' },
      ],
    },
  ],
};

export const getProjectHeadActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Head ID', format: 'number' },
    ...promptHeadFields,
    { key: 'project', label: 'Project', children: promptHeadProjectFields },
  ],
};

export const runPromptActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Run ID', format: 'number' },
    { key: 'transaction_id', label: 'Transaction ID', format: 'number' },
    { key: 'provider', label: 'Provider' },
    { key: 'model', label: 'Model' },
    { key: 'text', label: 'Response Text' },
    { key: 'finish_reason', label: 'Finish Reason' },
    { key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
    { key: 'completion_tokens', label: 'Completion Tokens', format: 'number' },
    { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
    { key: 'cost', label: 'Cost', format: 'currency', currency: 'USD' },
    { key: 'latency', label: 'Latency (ms)', format: 'duration' },
    { key: 'total_time', label: 'Total Time (ms)', format: 'duration' },
    { key: 'project', label: 'Project', children: promptHeadProjectFields },
  ],
};
