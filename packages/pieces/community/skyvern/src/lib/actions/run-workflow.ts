import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL } from '../common';
import { skyvernAuth } from '../common/auth';

export const runWorkflowAction = createAction({
  auth: skyvernAuth,
  name: 'run-workflow',
  displayName: 'Run Workflow',
  description: 'Runs the workflow.',
  props: {
    workflowId: Property.Dropdown({
      displayName: 'Workflow',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }

        const response = await httpClient.sendRequest<
          { workflow_permanent_id: string; title: string }[]
        >({
          method: HttpMethod.GET,
          url: BASE_URL + '/workflows',
          headers: {
            'x-api-key': auth as string,
          },
          queryParams: {
            page_size: '100',
          },
        });

        return {
          disabled: false,
          options: response.body.map((workflow) => ({
            label: workflow.title,
            value: workflow.workflow_permanent_id,
          })),
        };
      },
    }),
    proxyLocation: Property.StaticDropdown({
      displayName: 'Proxy Location',
      required: false,
      options: {
        disabled: false,
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
    webhookUrl: Property.ShortText({
      displayName: 'Webhook Callback URL',
      required: false,
    }),
    parameters: Property.Json({
      displayName: 'Workflow Parameters',
      required: false,
    }),
  },
  async run(context) {
    const { workflowId, webhookUrl, proxyLocation, parameters } =
      context.propsValue;
    const apiKey = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + `/run/workflows`,
      headers: {
        'x-api-key': apiKey,
      },
      body: {
        workflow_id: workflowId,
        proxy_location: proxyLocation,
        parameters,
        webhook_url: webhookUrl,
      },
    });

    return response.body;
  },
});
