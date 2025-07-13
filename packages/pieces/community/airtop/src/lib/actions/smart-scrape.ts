import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

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
	async run(context) {
		const {
			sessionId,
			windowId,
			clientRequestId,
			costThresholdCredits,
			timeThresholdSeconds,
		} = context.propsValue;

		await propsValidation.validateZod(context.propsValue, {
			costThresholdCredits: z.number().min(0).optional(),
			timeThresholdSeconds: z.number().min(0).optional(),
		});

		const body: Record<string, any> = {};

		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}

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
