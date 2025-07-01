import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';

export const createSessionAction = createAction({
	name: 'create-session',
	auth: airtopAuth,
	displayName: 'Create Session',
	description: 'Starts a new browser session in Airtop.',
	props: {
		profileName: Property.ShortText({
			displayName: 'Profile Name',
			description: 'Name of a profile to load into the session.',
			required: false,
		}),
		extensionIds: Property.Array({
			displayName: 'Extension IDs',
			description: 'List of Chrome extension IDs from Google Web Store.',
			required: false,
		}),
		useAirtopProxy: Property.Checkbox({
			displayName: 'Use Airtop Proxy?',
			description: 'Enable Airtop-provided proxy. If disabled, use custom proxy config.',
			required: false,
			defaultValue: true,
		}),
		solveCaptcha: Property.Checkbox({
			displayName: 'Solve Captcha',
			description: 'Automatically solve captcha challenges.',
			required: false,
		}),
		timeoutMinutes: Property.Number({
			displayName: 'Timeout (minutes)',
			description: 'Idle timeout in minutes (1 - 10080). Defaults to 10.',
			required: false,
		}),
	},
	async run(context) {
		const {
			profileName,
			extensionIds,
			useAirtopProxy,
			solveCaptcha,
			timeoutMinutes,
		} = context.propsValue;

		const config: Record<string, any> = {};

		if (profileName) config['profileName'] = profileName;
		if (extensionIds) config['extensionIds'] = extensionIds;
		if (typeof useAirtopProxy !== 'undefined') config['proxy'] = useAirtopProxy;
		if (typeof solveCaptcha !== 'undefined') config['solveCaptcha'] = solveCaptcha;
		if (timeoutMinutes) config['timeoutMinutes'] = timeoutMinutes;

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/sessions',
			body: {
				configuration: Object.keys(config).length > 0 ? config : undefined,
			},
		});

		return response;
	},
});
