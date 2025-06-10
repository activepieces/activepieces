import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { skyvernAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { workflowDropdown } from '../common/workflows';


export const runWorkflow = createAction({
  auth: skyvernAuth,
  name: 'runWorkflow',
  displayName: 'Run Workflow',
  description: 'Run a workflow with optional parameters and configuration',
  props: {
    workflow_id: workflowDropdown,
    parameters: Property.Json({
      displayName: 'Parameters',
      description: 'Parameters to pass to the workflow',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title for this workflow run',
      required: false,
    }),
    proxy_location: Property.StaticDropdown({
      displayName: 'Proxy Location',
      description: 'Geographic Proxy location to route the browser traffic through',
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
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL to send workflow status updates to after a run is finished',
      required: false,
    }),
    totp_url: Property.ShortText({
      displayName: 'TOTP URL',
      description: 'URL that serves TOTP/2FA/MFA codes for Skyvern to use during the workflow run',
      required: false,
    }),
    totp_identifier: Property.ShortText({
      displayName: 'TOTP Identifier',
      description: 'Identifier for the TOTP/2FA/MFA code when the code is pushed to Skyvern',
      required: false,
    }),
    browser_session_id: Property.ShortText({
      displayName: 'Browser Session ID',
      description: 'ID of a Skyvern browser session to reuse, having it continue from the current screen state',
      required: false,
    }),
    template: Property.Checkbox({
      displayName: 'Template',
      description: 'Whether to run as a template',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      workflow_id,
      parameters,
      title,
      proxy_location,
      webhook_url,
      totp_url,
      totp_identifier,
      browser_session_id,
      template,
    } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (template) queryParams.append('template', template.toString());

    const response = await makeRequest(
      { apiKey: context.auth.apiKey },
      HttpMethod.POST,
      `/run/workflows${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        workflow_id,
        parameters,
        title,
        proxy_location,
        webhook_url,
        totp_url,
        totp_identifier,
        browser_session_id,
      }
    );

    return response;
  },
});
