import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { skyvernAuth } from '../../index';

export const runWorkflowAction = createAction({
  auth: skyvernAuth,
  name: 'run_workflow',
  displayName: 'Run Workflow',
  description: 'Run a Skyvern workflow by providing a workflow ID and optional settings.',
  props: {
    workflow_id: Property.ShortText({
      displayName: 'Workflow ID',
      description: 'ID of the workflow to run (starts with wpid_).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Optional title for this workflow run.',
      required: false,
    }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description: 'Optional parameters to pass to the workflow as key-value pairs.',
      required: false,
    }),
    proxy_location: Property.StaticDropdown({
      displayName: 'Proxy Location',
      description: 'Select a proxy location for the workflow run.',
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
          { label: 'ISP Proxy', value: 'RESIDENTIAL_ISP' },
          { label: 'California (US)', value: 'US-CA' },
          { label: 'New York (US)', value: 'US-NY' },
          { label: 'Texas (US)', value: 'US-TX' },
          { label: 'Florida (US)', value: 'US-FL' },
          { label: 'Washington (US)', value: 'US-WA' },
          { label: 'No Proxy', value: 'NONE' },
        ],
      },
    }),
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Optional URL to receive status updates for the workflow.',
      required: false,
    }),
    totp_identifier: Property.ShortText({
      displayName: 'TOTP Identifier',
      description: 'Optional identifier for pushing 2FA/MFA codes to Skyvern.',
      required: false,
    }),
    totp_url: Property.ShortText({
      displayName: 'TOTP URL',
      description: 'Optional URL where Skyvern can fetch 2FA/MFA codes.',
      required: false,
    }),
    browser_session_id: Property.ShortText({
      displayName: 'Browser Session ID',
      description: 'Optional session ID to continue from a previous session.',
      required: false,
    }),
  },
  async run(context) {
    const {
      workflow_id,
      parameters,
      title,
      proxy_location,
      webhook_url,
      totp_identifier,
      totp_url,
      browser_session_id,
    } = context.propsValue;

    const { apiKey } = context.auth as { apiKey: string };

    const payload: Record<string, unknown> = {
      workflow_id,
    };

    if (parameters) payload['parameters'] = parameters;
    if (title) payload['title'] = title;
    if (proxy_location) payload['proxy_location'] = proxy_location;
    if (webhook_url) payload['webhook_url'] = webhook_url;
    if (totp_identifier) payload['totp_identifier'] = totp_identifier;
    if (totp_url) payload['totp_url'] = totp_url;
    if (browser_session_id) payload['browser_session_id'] = browser_session_id;

    const result = await makeRequest(
      { apiKey },
      HttpMethod.POST,
      '/run/workflows',
      payload
    );

    return result;
  },
});
