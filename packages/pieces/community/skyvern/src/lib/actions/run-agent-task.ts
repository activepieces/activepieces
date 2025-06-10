import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { skyvernAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const runAgentTask = createAction({
  auth: skyvernAuth,
  name: 'runAgentTask',
  displayName: 'Run Agent Task',
  description: 'Run a task using Skyvern agent',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The goal or task description for Skyvern to accomplish',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'Starting URL',
      description:
        'The starting URL for the task. If not provided, Skyvern will attempt to determine an appropriate URL',
      required: false,
    }),
    engine: Property.StaticDropdown({
      displayName: 'Engine',
      description: 'The engine that powers the agent task',
      required: false,
      options: {
        options: [
          { label: 'Skyvern 2.0', value: 'skyvern-2.0' },
          { label: 'Skyvern 1.0', value: 'skyvern-1.0' },
          { label: 'OpenAI CUA', value: 'openai-cua' },
          { label: 'Anthropic CUA', value: 'anthropic-cua' },
        ],
      },
      defaultValue: 'skyvern-2.0',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title for the task',
      required: false,
    }),
    proxy_location: Property.StaticDropdown({
      displayName: 'Proxy Location',
      description:
        'Geographic Proxy location to route the browser traffic through',
      required: false,
      options: {
        options: [
          { label: 'US Residential (Default)', value: 'RESIDENTIAL' },
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
          { label: 'California', value: 'US-CA' },
          { label: 'New York', value: 'US-NY' },
          { label: 'Texas', value: 'US-TX' },
          { label: 'Florida', value: 'US-FL' },
          { label: 'Washington', value: 'US-WA' },
          { label: 'No Proxy', value: 'NONE' },
        ],
      },
      defaultValue: 'RESIDENTIAL',
    }),
    max_steps: Property.Number({
      displayName: 'Max Steps',
      description: 'Maximum number of steps the task can take',
      required: false,
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL to send task status updates to after a run is finished',
      required: false,
    }),
    totp_identifier: Property.ShortText({
      displayName: 'TOTP Identifier',
      description:
        'Identifier for the TOTP/2FA/MFA code when the code is pushed to Skyvern',
      required: false,
    }),
    totp_url: Property.ShortText({
      displayName: 'TOTP URL',
      description:
        'URL that serves TOTP/2FA/MFA codes for Skyvern to use during the workflow run',
      required: false,
    }),
    browser_session_id: Property.ShortText({
      displayName: 'Browser Session ID',
      description: 'Run the task in a specific Skyvern browser session',
      required: false,
    }),
    publish_workflow: Property.Checkbox({
      displayName: 'Publish Workflow',
      description: 'Whether to publish this task as a reusable workflow',
      required: false,
      defaultValue: false,
    }),
    include_action_history_in_verification: Property.Checkbox({
      displayName: 'Include Action History in Verification',
      description:
        'Whether to include action history when verifying that the task is complete',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      prompt,
      url,
      engine,
      title,
      proxy_location,
      max_steps,
      webhook_url,
      totp_identifier,
      totp_url,
      browser_session_id,
      publish_workflow,
      include_action_history_in_verification,
    } = context.propsValue;

    const response = await makeRequest(
      { apiKey: context.auth.apiKey },
      HttpMethod.POST,
      '/run/tasks',
      {
        prompt,
        url,
        engine,
        title,
        proxy_location,
        max_steps,
        webhook_url,
        totp_identifier,
        totp_url,
        browser_session_id,
        publish_workflow,
        include_action_history_in_verification,
      }
    );

    return response;
  },
});
