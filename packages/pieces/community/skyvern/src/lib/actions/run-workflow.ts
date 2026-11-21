import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';
import { workflowId, workflowParams } from '../common/props';

export const runWorkflowAction = createAction({
	auth: skyvernAuth,
	name: 'run-workflow',
	classification: 'WRITE',
	displayName: 'Run Workflow',
	description: 'Starts a run of one of your Skyvern workflows.',
	audience: 'both',
	aiMetadata: { description: 'Starts a run of an existing Skyvern workflow identified by its workflow ID, passing any workflow parameters. Use when an agent should execute a predefined multi-step automation rather than an ad-hoc prompt-driven task. Each call triggers a new asynchronous run (not idempotent); the response returns a run identifier you poll separately with Get Run.', idempotent: false },
	props: {
		runInfo: Property.MarkDown({
			value:
				'The workflow runs in the background. Pass the returned run ID to **Get Run** to read its result.',
			variant: MarkdownVariant.INFO,
		}),
		workflowId: workflowId,
		parameters: workflowParams,
		title: Property.ShortText({
			displayName: 'Run Title',
			required: false,
			advanced: true,
			description: 'A name for this run in Skyvern.',
			placeholder: 'Weekly invoice download',
		}),
		proxyLocation: Property.StaticDropdown({
			displayName: 'Proxy Location',
			description: 'Where the browser traffic appears to come from.',
			advanced: true,
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
			description: 'Skyvern sends the run result here when it finishes.',
			placeholder: 'https://example.com/skyvern-webhook',
			advanced: true,
			required: false,
		}),
	},
	propertyGroups: [
		{
			key: 'workflow',
			display: 'section',
			label: 'Workflow',
			icon: 'sliders',
			props: ['runInfo', 'workflowId', 'parameters'],
		},
	],
	async run(context) {
		const { workflowId, title, webhookUrl, proxyLocation, parameters } = context.propsValue;

		const response = await skyvernApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/run/workflows`,
			body: {
				workflow_id: workflowId,
				title,
				proxy_location: proxyLocation,
				parameters,
				webhook_url: webhookUrl,
			},
		});

		return response;
	},
});
