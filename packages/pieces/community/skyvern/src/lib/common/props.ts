import { Property } from '@activepieces/pieces-framework';

export const skyVernProps = {
  x_user_agent: Property.ShortText({
    displayName: 'x-user-agent',
    description:
      'Optional. A custom string to identify the client making the request.',
    required: false,
  }),
  x_max_steps_override: Property.Number({
    displayName: 'x-max-steps-override',
    description:
      'Optional. Overrides the maximum number of steps for a task run.',
    required: false,
  }),
  prompt: Property.LongText({
    displayName: 'Prompt',
    description:
      'The goal or task description for Skyvern to accomplish (e.g., "Extract product names and prices").',
    required: true,
  }),
  url: Property.ShortText({
    displayName: 'Starting URL',
    description:
      'The URL where Skyvern should start the task. If not provided, Skyvern will attempt to determine an appropriate URL.',
    required: false,
  }),
  engine: Property.StaticDropdown({
    displayName: 'Engine',
    description:
      'The AI engine that powers the agent task. Skyvern 2.0 is recommended for complex tasks.',
    required: false,
    defaultValue: 'skyvern-2.0',
    options: {
      options: [
        { label: 'Skyvern 1.0', value: 'skyvern-1.0' },
        { label: 'Skyvern 2.0 (Default)', value: 'skyvern-2.0' },
        { label: 'OpenAI CUA', value: 'openai-cua' },
        { label: 'Anthropic CUA', value: 'anthropic-cua' },
      ],
    },
  }),
  title: Property.ShortText({
    displayName: 'Task Title',
    description: 'An optional, human-readable title for this task.',
    required: false,
  }),
  proxy_location: Property.StaticDropdown({
    displayName: 'Proxy Location',
    description:
      'Geographic proxy location to route browser traffic through (Skyvern Cloud only).',
    required: false,
    options: {
      options: [
        { label: 'Residential (Random US, Default)', value: 'RESIDENTIAL' },
        { label: 'Spain', value: 'RESIDENTIAL_ES' },
        { label: 'Ireland', value: 'RESIDENTIAL_IE' },
        { label: 'United Kingdom', value: 'RESIDENTIAL_GB' },
        { label: 'India', value: 'RESIDENTIAL_IN' },
        { label: 'Japan', value: 'RESIDENTIAL_JP' },
        { label: 'France', value: 'RESIDENTIAL_FR' },
        { label: 'Germany', value: 'RESIDENTIAL_DE' },
        { label: 'New Zealand', value: 'RESIDENTIAL_NZ' },
        { label: 'South Africa', value: 'RESIDENTIAL_ZA' },
        { label: 'Argentina', value: 'RESIDENTIAL_AR' },
        { label: 'ISP Proxy', value: 'RESIDENTIAL_ISP' },
        { label: 'US-California', value: 'US-CA' },
        { label: 'US-New York', value: 'US-NY' },
        { label: 'US-Texas', value: 'US-TX' },
        { label: 'US-Florida', value: 'US-FL' },
        { label: 'US-Washington', value: 'US-WA' },
        { label: 'No Proxy', value: 'NONE' },
      ],
    },
  }),
  data_extraction_schema: Property.Json({
    displayName: 'Data Extraction Schema (JSON)',
    description:
      'Optional JSON schema (e.g., https://json-schema.org/) for structured data extraction.',
    required: false,
    defaultValue: { key: 'value' },
  }),
  error_code_mapping: Property.Json({
    displayName: 'Error  JSON Mapping (JSON)',
    description:
      'Optional custom mapping of Skyvern error  JSONs to your desired error messages.',
    required: false,
    defaultValue: { key: 'value' },
  }),
  max_steps: Property.Number({
    displayName: 'Max Steps',
    description:
      'Maximum number of steps the task can take. Task will fail if this is exceeded. You are charged per step.',
    required: false,
  }),
  webhook_url: Property.ShortText({
    displayName: 'Webhook URL',
    description: 'URL to send task status updates to after a run is finished.',
    required: false,
  }),
  totp_identifier: Property.ShortText({
    displayName: 'TOTP Identifier',
    description: 'Identifier for TOTP/2FA/MFA  JSON when pushed to Skyvern.',
    required: false,
  }),
  totp_url: Property.ShortText({
    displayName: 'TOTP URL',
    description:
      'URL that serves TOTP/2FA/MFA  JSONs for Skyvern to use during the workflow run.',
    required: false,
  }),
  browser_session_id: Property.ShortText({
    displayName: 'Browser Session ID',
    description:
      'Run the task in a specific Skyvern browser session to persist state from previous runs.',
    required: false,
  }),
  model: Property.Json({
    displayName: 'Model Configuration (JSON)',
    description: 'Optional model-specific configuration as a JSON object.',
    required: false,
    defaultValue: { key: 'value' },
  }),
  publish_workflow: Property.Checkbox({
    displayName: 'Publish as Workflow',
    description:
      'Set to true to publish this task as a reusable workflow (only available for Skyvern 2.0).',
    required: false,
    defaultValue: false,
  }),
  include_action_history_in_verification: Property.Checkbox({
    displayName: 'Include Action History in Verification',
    description:
      'Set to true to include action history when verifying task completion.',
    required: false,
    defaultValue: false,
  }),
  run_id: Property.ShortText({
    displayName: 'Run ID',
    description:
      'The unique identifier for the task run (starts with tsk_) or workflow run (starts with wr_).',
    required: true,
  }),
  workflow_id: Property.ShortText({
    displayName: 'Workflow ID',
    description: 'The ID of the workflow to run (starts with wpid_).',
    required: true,
  }),
  parameters: Property.Json({
    displayName: 'Workflow Parameters (JSON)',
    description:
      'Optional parameters to pass to the workflow as a JSON object.',
    required: false,
    defaultValue: { key: 'value' },
  }),
  page: Property.Number({
    displayName: 'Page',
    description: 'The page number for results (defaults to 1).',
    required: false,
    defaultValue: 1,
  }),
  page_size: Property.Number({
    displayName: 'Page Size',
    description: 'The number of items per page (defaults to 10).',
    required: false,
    defaultValue: 10,
  }),
  only_saved_tasks: Property.Checkbox({
    displayName: 'Only Saved Tasks',
    description: 'Set to true to retrieve only saved tasks.',
    required: false,
    defaultValue: false,
  }),
  only_workflows: Property.Checkbox({
    displayName: 'Only Workflows',
    description: 'Set to true to retrieve only published workflows.',
    required: false,
    defaultValue: false,
  }),
  template: Property.Checkbox({
    displayName: 'Is Template',
    description: 'Set to true to retrieve workflow templates.',
    required: false,
    defaultValue: false,
  }),
};
