import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const pageQueryAction = createAction({
	name: 'page-query',
	auth: airtopAuth,
	displayName: 'Page Query',
	description: 'Query a page to extract data or ask a question given the data on the page.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'The question or instruction for Airtop to answer about the current page.',
			required: true,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'An optional ID for your internal tracking.',
			required: false,
		}),
		outputSchema: Property.LongText({
			displayName: 'Output Schema (JSON)',
			description: 'JSON schema defining the structure of the output. Must be valid JSON schema format.',
			required: false,
		}),
		includeVisualAnalysis: Property.StaticDropdown({
			displayName: 'Visual Analysis',
			description: 'Whether to include visual analysis of the page (default: auto)',
			defaultValue: 'auto',
			required: false,
			options: {
				options: [
					{ label: 'Auto (Default)', value: 'auto' },
					{ label: 'Enabled', value: 'enabled' },
					{ label: 'Disabled', value: 'disabled' },
				],
			},
		}),
		optimizeUrls: Property.StaticDropdown({
			displayName: 'Optimize URLs',
			description: 'Improve scraping performance by optimizing URLs (default: auto)',
			defaultValue: 'auto',
			required: false,
			options: {
				options: [
					{ label: 'Auto (Default)', value: 'auto' },
					{ label: 'Enabled', value: 'enabled' },
					{ label: 'Disabled', value: 'disabled' },
				],
			},
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Maximum Credits to Spend',
			description: 'Abort if the credit cost exceeds this amount. Set to 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Maximum Time (Seconds)',
			description: 'Abort if the operation takes longer than this. Set to 0 to disable.',
			required: false,
		}),
		followPaginationLinks: Property.Checkbox({
			displayName: 'Follow Pagination Links',
			description:
				'If enabled, Airtop will attempt to load more content from pagination, scrolling, etc. (default: false)',
			required: false,
		})
	},
	async run({ propsValue, auth }) {
		const {
			sessionId,
			windowId,
			prompt,
			clientRequestId,
			costThresholdCredits,
			followPaginationLinks,
			timeThresholdSeconds,
			outputSchema,
			includeVisualAnalysis,
			optimizeUrls,
		} = propsValue;

		await propsValidation.validateZod(propsValue, {
			costThresholdCredits: z.number().min(0).optional(),
			timeThresholdSeconds: z.number().min(0).optional(),
			outputSchema: z.string().refine((val) => {
				if (!val) return true;
				try {
					JSON.parse(val);
					return true;
				} catch {
					return false;
				}
			}, { message: 'Must be valid JSON format' }).optional(),
		});

		const configuration: Record<string, any> = {};

		if (outputSchema) {
			configuration['outputSchema'] = outputSchema;
		}

		if (optimizeUrls !== 'auto') {
			configuration['scrape'] = {
				optimizeUrls,
			};
		}

		if (includeVisualAnalysis !== 'auto') {
			configuration['experimental'] = {
				includeVisualAnalysis,
			};
		}

		if (typeof costThresholdCredits === 'number') {
			configuration['costThresholdCredits'] = costThresholdCredits;
		}

		if (followPaginationLinks === true) {
			configuration['followPaginationLinks'] = followPaginationLinks;
		}

		if (typeof timeThresholdSeconds === 'number') {
			configuration['timeThresholdSeconds'] = timeThresholdSeconds;
		}

		const body: Record<string, any> = {
			prompt,
		};

		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}

		if (Object.keys(configuration).length > 0) {
			body['configuration'] = configuration;
		}

		const response = await airtopApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/page-query`,
			body,
		});

		return response;
	},
});
