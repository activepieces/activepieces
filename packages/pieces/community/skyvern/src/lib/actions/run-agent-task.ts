import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { skyvernAuth } from '../../index';

export const runAgentTaskAction = createAction({
  auth: skyvernAuth,
  name: 'run_agent_task',
  displayName: 'Run Agent Task',
  description: 'Run a Skyvern agent task based on the provided prompt and optional parameters.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The task description or goal you want Skyvern to accomplish.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Optional starting URL for the task.',
      required: false,
    }),
    engine: Property.StaticDropdown({
      displayName: 'Engine',
      description: 'Select the engine to use for the task.',
      required: false,
      options: {
        options: [
          { label: 'Skyvern 1.0', value: 'skyvern-1.0' },
          { label: 'Skyvern 2.0', value: 'skyvern-2.0' },
          { label: 'OpenAI CUA', value: 'openai-cua' },
          { label: 'Anthropic CUA', value: 'anthropic-cua' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Optional title for the task.',
      required: false,
    }),
    proxy_location: Property.StaticDropdown({
      displayName: 'Proxy Location',
      description: 'Select the proxy location.',
      required: false,
      options: {
        options: [
          { label: 'Residential', value: 'RESIDENTIAL' },
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
          { label: 'ISP', value: 'RESIDENTIAL_ISP' },
          { label: 'California', value: 'US-CA' },
          { label: 'New York', value: 'US-NY' },
          { label: 'Texas', value: 'US-TX' },
          { label: 'Florida', value: 'US-FL' },
          { label: 'Washington', value: 'US-WA' },
          { label: 'No Proxy', value: 'NONE' },
        ],
      },
    }),
    max_steps: Property.Number({
      displayName: 'Max Steps',
      description: 'Maximum number of steps the task can take.',
      required: false,
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL to send task status updates to.',
      required: false,
    }),
    publish_workflow: Property.Checkbox({
      displayName: 'Publish Workflow',
      description: 'Publish this task as a reusable workflow.',
      required: false,
      defaultValue: false,
    }),
    include_action_history_in_verification: Property.Checkbox({
      displayName: 'Include Action History in Verification',
      description: 'Include action history when verifying task completion.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { prompt, url, engine, title, proxy_location, max_steps, webhook_url, publish_workflow, include_action_history_in_verification } = context.propsValue;

    const { apiKey } = context.auth as { apiKey: string };

    const payload: Record<string, unknown> = { prompt };

    if (url) payload['url'] = url;
    if (engine) payload['engine'] = engine;
    if (title) payload['title'] = title;
    if (proxy_location) payload['proxy_location'] = proxy_location;
    if (max_steps) payload['max_steps'] = max_steps;
    if (webhook_url) payload['webhook_url'] = webhook_url;
    if (publish_workflow !== undefined) payload['publish_workflow'] = publish_workflow;
    if (include_action_history_in_verification !== undefined) payload['include_action_history_in_verification'] = include_action_history_in_verification;

    const result = await makeRequest(
      { apiKey },
      HttpMethod.POST,
      '/run/tasks',
      payload
    );

    return result;
  },
});
