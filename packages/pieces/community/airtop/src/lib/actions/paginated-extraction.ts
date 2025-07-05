import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';

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
		costThresholdCredits: Property.Number({
			displayName: 'Cost Threshold (Credits)',
			description: 'Cancel if the credit threshold is exceeded. Set 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Time Threshold (Seconds)',
			description: 'Cancel if the request exceeds this time. Set 0 to disable.',
			required: false,
		}),
		configuration: Property.Object({
			displayName: 'Configuration',
			description: 'Request configuration',
			required: false
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			prompt,
			clientRequestId,
			costThresholdCredits,
			timeThresholdSeconds,
			configuration,
		} = context.propsValue;

		const body: Record<string, any> = {
			prompt,
		};

		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}

		const config: Record<string, any> = configuration ?? {};

		if (typeof costThresholdCredits === 'number') {
			config['costThresholdCredits'] = costThresholdCredits;
		}

		if (typeof timeThresholdSeconds === 'number') {
			config['timeThresholdSeconds'] = timeThresholdSeconds;
		}

		if (Object.keys(config).length > 0) {
			body['configuration'] = config;
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/paginated-extraction`,
			body,
		});

		return response;
	}

});
