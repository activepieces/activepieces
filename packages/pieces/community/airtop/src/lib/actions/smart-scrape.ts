import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';

export const smartScrapeAction = createAction({
	name: 'smart-scrape',
	auth: airtopAuth,
	displayName: 'Smart Scrape',
	description: 'Scrape a page and return the data as Markdown.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			description: 'Optional ID to track this request on your end.',
			required: false,
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Cost Threshold (Credits)',
			description: 'Cancel if the operation exceeds this credit threshold. Set 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Time Threshold (Seconds)',
			description: 'Cancel if the operation exceeds this time threshold. Set 0 to disable.',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			clientRequestId,
			costThresholdCredits,
			timeThresholdSeconds,
		} = context.propsValue;

		const body: Record<string, any> = {};

		if (clientRequestId) body['clientRequestId'] = clientRequestId;
		if (typeof costThresholdCredits === 'number') {
			body['costThresholdCredits'] = costThresholdCredits;
		}
		if (typeof timeThresholdSeconds === 'number') {
			body['timeThresholdSeconds'] = timeThresholdSeconds;
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/scrape-content`,
			body,
		});

		return response;
	},
});
