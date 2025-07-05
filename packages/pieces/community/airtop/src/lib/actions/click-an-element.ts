import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';

export const clickAction = createAction({
	name: 'click',
	auth: airtopAuth,
	displayName: 'Click',
	description: 'Execute a click interaction in a specific browser window.',
	props: {
		sessionId: sessionId,
		windowId: windowId,
		elementDescription: Property.ShortText({
			displayName: 'Element Description',
			description: 'Describe the element to click (e.g. "Login button").',
			required: true,
		}),
		clientRequestId: Property.ShortText({
			displayName: 'Client Request ID',
			required: false,
		}),
		waitForNavigation: Property.Checkbox({
			displayName: 'Wait for Navigation',
			description: 'Wait for page navigation to complete after clicking.',
			required: false,
			defaultValue: false,
		}),
		costThresholdCredits: Property.Number({
			displayName: 'Cost Threshold (Credits)',
			description:
				'Cancel if the credit threshold is exceeded. Set to 0 to disable.',
			required: false,
		}),
		timeThresholdSeconds: Property.Number({
			displayName: 'Time Threshold (Seconds)',
			description:
				'Cancel if the request exceeds this time. Set to 0 to disable.',
			required: false,
		}),
		configuration: Property.Object({
			displayName: 'Configuration',
			description: 'Advanced configuration for click behavior, scroll, visual analysis, etc.',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			windowId,
			elementDescription,
			clientRequestId,
			waitForNavigation,
			costThresholdCredits,
			timeThresholdSeconds,
			configuration,
		} = context.propsValue;

		const body: Record<string, any> = {
			elementDescription,
		};

		if (clientRequestId) body['clientRequestId'] = clientRequestId;

		const config: Record<string, any> = configuration ? { ...configuration } : {};

		if (waitForNavigation) config['waitForNavigation'] = true;
		if (typeof costThresholdCredits === 'number') config['costThresholdCredits'] = costThresholdCredits;
		if (typeof timeThresholdSeconds === 'number') config['timeThresholdSeconds'] = timeThresholdSeconds;

		if (Object.keys(config).length > 0) {
			body['configuration'] = config;
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows/${windowId}/click`,
			body,
		});

		return response;
	},
});
