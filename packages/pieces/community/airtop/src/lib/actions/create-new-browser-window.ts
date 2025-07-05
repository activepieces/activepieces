import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId } from '../common/props';

export const createNewBrowserWindowAction = createAction({
	name: 'create-browser-window',
	auth: airtopAuth,
	displayName: 'Create New Browser Window',
	description: 'Opens a new window within a session, optionally navigating to a URL.',
	props: {
		sessionId: sessionId,
		url: Property.ShortText({
			displayName: 'Initial URL',
			description: 'URL to open in the new window. Defaults to https://www.google.com.',
			required: false,
		}),
		screenResolution: Property.ShortText({
			displayName: 'Screen Resolution',
			description: 'Screen resolution like "1280x720". Affects live view size.',
			required: false,
		}),
		waitUntil: Property.StaticDropdown({
			displayName: 'Wait Until',
			description: 'Wait strategy for page load before returning.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'load', value: 'load' },
					{ label: 'domContentLoaded', value: 'domContentLoaded' },
					{ label: 'complete', value: 'complete' },
					{ label: 'noWait', value: 'noWait' },
				],
			},
		}),
		waitUntilTimeoutSeconds: Property.Number({
			displayName: 'Wait Until Timeout (seconds)',
			description: 'Max seconds to wait for the specified loading event. Defaults to 30.',
			required: false,
		}),
	},
	async run(context) {
		const {
			sessionId,
			url,
			screenResolution,
			waitUntil,
			waitUntilTimeoutSeconds,
		} = context.propsValue;

		const body: Record<string, any> = {};

		if (url) body['url'] = url;
		if (screenResolution) body['screenResolution'] = screenResolution;
		if (waitUntil) body['waitUntil'] = waitUntil;
		if (waitUntilTimeoutSeconds) body['waitUntilTimeoutSeconds'] = waitUntilTimeoutSeconds;

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/sessions/${sessionId}/windows`,
			body,
		});

		return response;
	},
});
