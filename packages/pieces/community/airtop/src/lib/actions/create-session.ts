import { HttpMethod } from '@activepieces/pieces-common';
import {
	createAction,
	DynamicPropsValue,
	InputPropertyMap,
	Property,
	PropertyContext,
} from '@activepieces/pieces-framework';
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
			description: 'Enable Airtop-provided proxy. If disabled, configure a custom proxy.',
			required: false,
			defaultValue: true,
		}),
		proxyConfig: Property.DynamicProperties({
			displayName: 'Custom Proxy Configuration',
			refreshers: ['useAirtopProxy'],
			required: false,
			props: async (propsValue: Record<string, unknown>, _ctx: PropertyContext): Promise<InputPropertyMap> => {
				const useAirtopProxy = propsValue['useAirtopProxy'] as boolean | undefined;

				if (useAirtopProxy === false) {
					return {
						proxyUrl: Property.ShortText({
							displayName: 'Proxy URL',
							description: 'The full proxy URL (e.g. http://user:pass@host:port)',
							required: true,
						}),
						proxyCountry: Property.ShortText({
							displayName: 'Proxy Country (ISO-2)',
							description: 'Country code like US/IN. Use "global" for random countries.',
							required: false,
						}),
						proxySticky: Property.Checkbox({
							displayName: 'Sticky IP',
							description: 'Try to keep the same IP address for up to 30 minutes.',
							defaultValue: true,
							required: false,
						}),
					};
				}
				return {};
			},
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
			proxyConfig,
		} = context.propsValue as {
			profileName?: string;
			extensionIds?: string[];
			useAirtopProxy?: boolean;
			solveCaptcha?: boolean;
			timeoutMinutes?: number;
			proxyConfig?: {
				proxyUrl?: string;
				proxyCountry?: string;
				proxySticky?: boolean;
			};
		};

		const config: Record<string, any> = {};

		if (profileName) config['profileName'] = profileName;
		if (extensionIds) config['extensionIds'] = extensionIds;
		if (typeof solveCaptcha !== 'undefined') config['solveCaptcha'] = solveCaptcha;
		if (timeoutMinutes) config['timeoutMinutes'] = timeoutMinutes;

		if (useAirtopProxy === false) {
			const proxyObject: Record<string, any> = {
				url: proxyConfig?.proxyUrl,
			};

			if (proxyConfig?.proxyCountry) proxyObject['country'] = proxyConfig.proxyCountry;
			if (typeof proxyConfig?.proxySticky === 'boolean') {
				proxyObject['sticky'] = proxyConfig.proxySticky;
			}

			config['proxy'] = proxyObject;
		} else {
			config['proxy'] = true;
		}

		const response = await airtopApiCall({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/sessions',
			body: {
				configuration: config,
			},
		});

		return response;
	},
});
