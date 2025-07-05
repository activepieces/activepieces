import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';

export const hoverElementAction = createAction({
	auth: airtopAuth,
	name: 'hover-element',
	displayName: 'Hover on an Element',
	description: 'Moves mouse pointer over an element in the browser window.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		elementDescription: Property.ShortText({
			displayName: 'Element Description',
			description:
				'A natural language description of the element to hover, e.g. "the search box input in the top right corner".',
			required: true,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			required: false,
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Cost Threshold (Credits)',
			description: 'Cancel if credit usage exceeds this amount. Set 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Time Threshold (Seconds)',
			description: 'Cancel if execution takes longer than this time. Set 0 to disable.',
			required: false,
		}),
		configuration: Property.Object({
			displayName: 'Configuration',
			description: 'Request configuration',
			required: false,
		}),
	},
	async run({ propsValue, auth }) {
		const {
			sessionId,
			windowId,
			elementDescription,
			clientRequestId,
			costThresholdCredits,
			timeThresholdSeconds,
			configuration,
		} = propsValue;

		const body: Record<string, any> = {
			elementDescription,
		};

		if (clientRequestId) {
			body['clientRequestId'] = clientRequestId;
		}

		const config: Record<string, any> = {};

		if (typeof costThresholdCredits === 'number') {
			config['costThresholdCredits'] = costThresholdCredits;
		}

		if (typeof timeThresholdSeconds === 'number') {
			config['timeThresholdSeconds'] = timeThresholdSeconds;
		}

		if (configuration && typeof configuration === 'object') {
			Object.assign(config, configuration);
		}

		if (Object.keys(config).length > 0) {
			body['configuration'] = config;
		}

		const response = await airtopApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/hover`,
			body,
		});

		return response;
	},
});
