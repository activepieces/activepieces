import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tavilyAuth } from '../../auth';
import { tavilyCommon } from '../../common/client';
import { tavilyStartResearchTaskOutputSchema } from '../../output-schemas';

export const startResearchTaskAction = createAction({
	name: 'tavily_start_research_task',
	outputSchema: tavilyStartResearchTaskOutputSchema,
	classification: 'WRITE',
	displayName: 'Start Research Task',
	description: 'Start an asynchronous, in-depth research task on a topic or question.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Queue a background research task that investigates a topic or question in depth and returns a request id. The task runs asynchronously; poll its result with `tavily_get_research_task` using the returned request id. Use for comprehensive, multi-source research beyond what a single search covers. Not idempotent: every call starts a new task.',
		idempotent: false,
	},
	auth: tavilyAuth,
	props: {
		input: Property.LongText({
			displayName: 'Research Question',
			description: 'The research task or question to investigate.',
			required: true,
		}),
		model: Property.StaticDropdown({
			displayName: 'Model',
			description: '"mini" for targeted research, "pro" for comprehensive multi-angle analysis.',
			required: false,
			defaultValue: 'auto',
			options: {
				options: [
					{ label: 'Auto', value: 'auto' },
					{ label: 'Mini', value: 'mini' },
					{ label: 'Pro', value: 'pro' },
				],
			},
		}),
		citation_format: Property.StaticDropdown({
			displayName: 'Citation Format',
			description: 'Citation style used in the report.',
			required: false,
			defaultValue: 'numbered',
			options: {
				options: [
					{ label: 'Numbered', value: 'numbered' },
					{ label: 'MLA', value: 'mla' },
					{ label: 'APA', value: 'apa' },
					{ label: 'Chicago', value: 'chicago' },
				],
			},
		}),
		output_length: Property.StaticDropdown({
			displayName: 'Output Length',
			description: 'Target size of the response.',
			required: false,
			defaultValue: 'standard',
			options: {
				options: [
					{ label: 'Short', value: 'short' },
					{ label: 'Standard', value: 'standard' },
					{ label: 'Long', value: 'long' },
				],
			},
		}),
		include_domains: Property.Array({
			displayName: 'Include Domains',
			description: 'Soft preference domains; research prioritizes these. Max 20.',
			required: false,
		}),
		exclude_domains: Property.Array({
			displayName: 'Exclude Domains',
			description: 'Hard blocklist; no URLs from these domains appear. Max 20.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return tavilyCommon.request({
			apiKey: auth.secret_text,
			method: HttpMethod.POST,
			path: '/research',
			body: {
				input: propsValue.input,
				model: propsValue.model,
				citation_format: propsValue.citation_format,
				output_length: propsValue.output_length,
				include_domains: propsValue.include_domains,
				exclude_domains: propsValue.exclude_domains,
				stream: false,
			},
		});
	},
});
