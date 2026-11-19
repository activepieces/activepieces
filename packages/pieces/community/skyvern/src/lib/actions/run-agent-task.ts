import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';

export const runAgentTaskAction = createAction({
	auth: skyvernAuth,
	name: 'run-agent-task',
	classification: 'WRITE',
	displayName: 'Run Agent Task',
	description: 'Starts a browser agent that does a task you describe.',
	audience: 'both',
	aiMetadata: { description: 'Launches a Skyvern browser-automation agent task from a natural-language prompt to navigate and act on a website, optionally starting at a given URL and extracting structured data via a schema. Use to have an AI agent perform a web task (browse, fill forms, click) rather than running a predefined workflow. Each call starts a new asynchronous run, so it is not idempotent; the response returns a run identifier you poll separately with Get Run.', idempotent: false },
	props: {
		runInfo: Property.MarkDown({
			value:
				'The task runs in the background. Pass the returned run ID to **Get Run** to read its result.',
			variant: MarkdownVariant.INFO,
		}),
		prompt: Property.ShortText({
			displayName: 'Prompt',
			description: 'What the agent should do, in plain words.',
			placeholder: 'Find the cheapest flight to London',
			required: true,
		}),
		url: Property.ShortText({
			displayName: 'Start URL',
			description: 'Leave empty to let Skyvern find a starting page.',
			placeholder: 'https://www.example.com',
			required: false,
		}),
		engine: Property.StaticDropdown({
			displayName: 'Engine',
			description: 'The AI agent that drives the browser.',
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
		dataExtractionSchema: Property.Json({
			displayName: 'Data to Extract',
			required: false,
			description: 'JSON Schema of the data the agent should return.',
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
		maxSteps: Property.Number({
			displayName: 'Max Steps',
			required: false,
			advanced: true,
			description: 'The task fails after this many steps. More steps can cost more.',
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
			key: 'task',
			display: 'section',
			label: 'Task',
			icon: 'text',
			props: ['runInfo', 'prompt', 'url', 'engine', 'dataExtractionSchema'],
		},
	],
	async run(context) {
		const { prompt, proxyLocation, url, webhookUrl, dataExtractionSchema, maxSteps, engine } =
			context.propsValue;

		const response = await skyvernApiCall({
			apiKey: context.auth.secret_text,
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
