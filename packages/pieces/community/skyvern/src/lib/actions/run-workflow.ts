import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';
import { workflowId, workflowParams } from '../common/props';

export const runWorkflowAction = createAction({
	auth: skyvernAuth,
	name: 'run-workflow',
	displayName: 'Run Workflow',
	description: 'Runs the workflow.',
	props: {
		workflowId: workflowId,
		title: Property.ShortText({
			displayName: 'Workflow Run Title',
			required: false,
			description: 'The title for this workflow run.',
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
		parameters: workflowParams,
	},
	async run(context) {
		const { workflowId, webhookUrl, proxyLocation, parameters } = context.propsValue;

		const response = await skyvernApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/run/workflows`,
			body: {
				workflow_id: workflowId,
				proxy_location: proxyLocation,
				parameters,
				webhook_url: webhookUrl,
			},
		});

		return response;
	},
});
