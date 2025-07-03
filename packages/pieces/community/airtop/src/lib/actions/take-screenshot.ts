import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';

export const takeScreenshotAction = createAction({
	name: 'take-screenshot',
	auth: airtopAuth,
	displayName: 'Take Screenshot',
	description: 'Captures a screenshot of the current window.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			required: false,
		}),
		maxHeight: Property.Number({
			displayName: 'Max Height (px)',
			required: false,
			description: 'Maximum height of the screenshot. Preserves aspect ratio.',
		}),
		maxWidth: Property.Number({
			displayName: 'Max Width (px)',
			required: false,
			description: 'Maximum width of the screenshot. Preserves aspect ratio.',
		}),
		quality: Property.Number({
			displayName: 'JPEG Quality (1-100)',
			required: false,
			description: 'Quality of the screenshot. In development, may not work as expected.',
		}),
		scope: Property.StaticDropdown({
			displayName: 'Scope',
			required: false,
			description: 'Whether to capture the viewport or the whole page.',
			options: {
				options: [{ label: 'Viewport', value: 'viewport' }],
			},
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Cost Threshold (Credits)',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Time Threshold (Seconds)',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			clientRequestId,
			maxHeight,
			maxWidth,
			quality,
			scope,
			costThresholdCredits,
			timeThresholdSeconds,
		} = context.propsValue;

		const body: Record<string, any> = {};

		if (clientRequestId) body['clientRequestId'] = clientRequestId;
		if (costThresholdCredits !== undefined) body['costThresholdCredits'] = costThresholdCredits;
		if (timeThresholdSeconds !== undefined) body['timeThresholdSeconds'] = timeThresholdSeconds;

		const screenshot: Record<string, any> = {};
		if (maxHeight !== undefined) screenshot['maxHeight'] = maxHeight;
		if (maxWidth !== undefined) screenshot['maxWidth'] = maxWidth;
		if (quality !== undefined) screenshot['quality'] = quality;
		if (scope) screenshot['scope'] = scope;

		if (Object.keys(screenshot).length > 0) {
			body['configuration'] = { screenshot };
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/screenshot`,
			body,
		});

		return {
			message: `Screenshot captured for session ${sessionId}, window ${windowId}.`,
			response,
		};
	},
});
