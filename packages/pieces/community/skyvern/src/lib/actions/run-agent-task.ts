import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';

export const runAgentTaskAction = createAction({
	auth: skyvernAuth,
	name: 'run-agent-task',
	displayName: 'Run Agent Task',
	description: 'Runs task with specified prompt.',
	props: {
		prompt: Property.ShortText({
			displayName: 'Prompt',
			description: 'The goal or task description for Skyvern to accomplish.',
			required: true,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			description: 'The starting URL for the task.',
			required: false,
		}),
		engine: Property.StaticDropdown({
			displayName: 'Engine',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Skyvern 1.0', value: 'skyvern-1.0' },
					{ label: 'Skyvern 2.0', value: 'skyvern-2.0' },
					{ label: 'OpenAI CUA', value: 'openai-cua' },
					{ label: 'Anthropic CUA', value: 'anthropic-cua' },
				],
			},
		}),
		webhookUrl: Property.ShortText({
			displayName: 'Webhook Callback URL',
			description: 'URL to send task status updates to after a run is finished.',
			required: false,
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
		maxSteps: Property.Number({
			displayName: 'Max Steps',
			required: false,
			description:
				'Maximum number of steps the task can take. Task will fail if it exceeds this number.',
		}),
		dataExtractionSchema: Property.Json({
			displayName: 'Data Extraction Schema',
			required: false,
			description: 'The schema for data to be extracted from the webpage.',
		}),
	},
	async run(context) {
		const { prompt, proxyLocation, url, webhookUrl, dataExtractionSchema, maxSteps, engine } =
			context.propsValue;

		const response = await skyvernApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/run/tasks',
			body: {
				prompt,
				url,
				engine,
				proxy_location: proxyLocation,
				data_extraction_schema: dataExtractionSchema,
				max_steps: maxSteps,
				webhook_url: webhookUrl,
			},
		});

		return response;
	},
});
