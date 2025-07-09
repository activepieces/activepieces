import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import {
	createAction,
	DynamicPropsValue,
	InputPropertyMap,
	Property,
	PropertyContext,
} from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { z } from 'zod';

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
						proxyType: Property.StaticDropdown({
							displayName: 'Proxy Configuration Type',
							description: 'Choose how to configure your proxy settings',
							required: true,
							defaultValue: 'simple',
							options: {
								options: [
									{ label: 'Simple URL Only', value: 'simple' },
									{ label: 'With Country/Sticky Settings', value: 'country_sticky' },
									{ label: 'With Authentication', value: 'auth' },
									{ label: 'Multiple Proxies (Domain Patterns)', value: 'multiple' },
								],
							},
						}),
						proxyUrl: Property.ShortText({
							displayName: 'Proxy URL',
							description: 'The proxy URL (e.g., http://proxy.example.com:8080)',
							required: true,
						}),
					};
				}
				return {};
			},
		}),
		proxyAdvanced: Property.DynamicProperties({
			displayName: 'Advanced Proxy Settings',
			refreshers: ['useAirtopProxy', 'proxyConfig'],
			required: false,
			props: async (propsValue: Record<string, unknown>, _ctx: PropertyContext): Promise<InputPropertyMap> => {
				const useAirtopProxy = propsValue['useAirtopProxy'] as boolean | undefined;
				const proxyConfig = propsValue['proxyConfig'] as any;
				
				if (useAirtopProxy === false && proxyConfig?.proxyType) {
					const proxyType = proxyConfig.proxyType;
					
					if (proxyType === 'country_sticky') {
						return {
							proxyCountry: Property.ShortText({
								displayName: 'Country Code',
								description: 'ISO 3166-1 alpha-2 format (e.g., "US", "GB"). Use "global" for random countries.',
								required: false,
								defaultValue: 'US',
							}),
							proxySticky: Property.Checkbox({
								displayName: 'Sticky IP',
								description: 'Try to maintain the same IP address for up to 30 minutes',
								required: false,
								defaultValue: true,
							}),
						};
					}
					
					if (proxyType === 'auth') {
						return {
							proxyUsername: Property.ShortText({
								displayName: 'Username',
								description: 'Username for proxy authentication',
								required: false,
							}),
							proxyPassword: Property.ShortText({
								displayName: 'Password',
								description: 'Password for proxy authentication',
								required: false,
							}),
						};
					}
					
					if (proxyType === 'multiple') {
						return {
							proxyList: Property.Array({
								displayName: 'Proxy List',
								description: 'Configure multiple proxies with domain patterns',
								required: true,
								properties: {
									domainPattern: Property.ShortText({
										displayName: 'Domain Pattern',
										description: 'Domain pattern (e.g., "*.example.com"). Use ? for single character, * for multiple.',
										required: true,
									}),
									relayUrl: Property.ShortText({
										displayName: 'Proxy URL',
										description: 'Proxy URL for this domain pattern',
										required: true,
									}),
								},
							}),
						};
					}
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
			displayName: 'Session Timeout (minutes)',
			description: 'How long before the session times out due to inactivity (1-10080 minutes). Default: 10.',
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
			proxyAdvanced,
		} = context.propsValue as {
			profileName?: string;
			extensionIds?: string[];
			useAirtopProxy?: boolean;
			solveCaptcha?: boolean;
			timeoutMinutes?: number;
			proxyConfig?: {
				proxyType?: string;
				proxyUrl?: string;
			};
			proxyAdvanced?: {
				proxyCountry?: string;
				proxySticky?: boolean;
				proxyUsername?: string;
				proxyPassword?: string;
				proxyList?: Array<{
					domainPattern: string;
					relayUrl: string;
				}>;
			};
		};

		await propsValidation.validateZod(context.propsValue, {
			timeoutMinutes: z.number().min(1).max(10080).optional(),
		});

		const config: Record<string, any> = {};

		if (profileName) config['profileName'] = profileName;
		if (extensionIds) config['extensionIds'] = extensionIds;
		if (typeof solveCaptcha !== 'undefined') config['solveCaptcha'] = solveCaptcha;
		if (timeoutMinutes) config['timeoutMinutes'] = timeoutMinutes;

		if (useAirtopProxy === false && proxyConfig?.proxyUrl) {
			const proxyType = proxyConfig.proxyType;
			
			if (proxyType === 'simple') {
				config['proxy'] = proxyConfig.proxyUrl;
			} else if (proxyType === 'country_sticky') {
				config['proxy'] = {
					country: proxyAdvanced?.proxyCountry || 'US',
					sticky: proxyAdvanced?.proxySticky !== false,
				};
			} else if (proxyType === 'auth') {
				const proxyObj: any = {
					url: proxyConfig.proxyUrl,
				};
				if (proxyAdvanced?.proxyUsername) {
					proxyObj.username = proxyAdvanced.proxyUsername;
				}
				if (proxyAdvanced?.proxyPassword) {
					proxyObj.password = proxyAdvanced.proxyPassword;
				}
				config['proxy'] = proxyObj;
			} else if (proxyType === 'multiple' && proxyAdvanced?.proxyList) {
				config['proxy'] = proxyAdvanced.proxyList.map((proxy) => ({
					domainPattern: proxy.domainPattern,
					relay: proxy.relayUrl,
				}));
			}
		} else if (useAirtopProxy !== false) {
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
