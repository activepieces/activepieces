import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const paginatedExtractionAction = createAction({
	name: 'paginated-extraction',
	auth: airtopAuth,
	displayName: 'Paginated Extraction',
	description: 'Extract content from paginated or dynamically loaded pages.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		prompt: Property.LongText({
			displayName: 'Prompt',
			description: 'Instructions on what to extract and how to paginate (e.g. "Navigate through 3 pages and extract titles and prices").',
			required: true,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'Optional ID to track this request.',
			required: false,
		}),
		outputSchema: Property.LongText({
			displayName: 'Output Schema (JSON)',
			description: 'JSON schema defining the structure of the output. Must be valid JSON schema format.',
			required: false,
		}),
		scrollWithin: Property.ShortText({
			displayName: 'Scroll Within',
			description: 'Describe the scrollable area (e.g. "results container in middle of page").',
			required: false,
		}),
		paginationMode: Property.StaticDropdown({
			displayName: 'How to Load More Content',
			description: 'Choose how to navigate through pages (default: auto)',
			defaultValue: 'auto',
			required: false,
			options: {
				options: [
					{ label: 'Auto (Recommended)', value: 'auto' },
					{ label: 'Click Next/Previous Links', value: 'paginated' },
					{ label: 'Infinite Scroll', value: 'infinite-scroll' },
				],
			},
		}),
		interactionMode: Property.StaticDropdown({
			displayName: 'Speed vs Accuracy',
			description: 'Balance between speed and accuracy (default: auto)',
			defaultValue: 'auto',
			required: false,
			options: {
				options: [
					{ label: 'Auto (Balanced)', value: 'auto' },
					{ label: 'More Accurate (Slower)', value: 'accurate' },
					{ label: 'Faster (Less Accurate)', value: 'cost-efficient' },
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
	},
	async run({ propsValue, auth }) {
		const {
			sessionId,
			windowId,
			prompt,
			clientRequestId,
			costThresholdCredits,
			timeThresholdSeconds,
			outputSchema,
			scrollWithin,
			paginationMode,
			interactionMode,
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

		if (scrollWithin) {
			configuration['experimental'] = {
				scrollWithin,
			};
		}

		if (paginationMode !== 'auto') {
			configuration['paginationMode'] = paginationMode;
		}

		if (interactionMode !== 'auto') {
			configuration['interactionMode'] = interactionMode;
		}

		if (optimizeUrls !== 'auto') {
			configuration['scrape'] = {
				optimizeUrls,
			};
		}

		if (typeof costThresholdCredits === 'number') {
			configuration['costThresholdCredits'] = costThresholdCredits;
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
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/paginated-extraction`,
			body,
		});

		return response;
	},
});
