import { Property, OAuth2PropertyValue, DynamicPropsValue } from '@activepieces/pieces-framework';
import {
	HttpRequest,
	HttpMethod,
	AuthenticationType,
	httpClient,
} from '@activepieces/pieces-common';

export const webflowCommon = {
	baseUrl: 'https://api.webflow.com/',
	subscribeWebhook: async (
		siteId: string,
		tag: string,
		webhookUrl: string,
		accessToken: string,
	) => {
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: `https://api.webflow.com/sites/${siteId}/webhooks`,
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				triggerType: tag,
				url: webhookUrl,
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			queryParams: {},
		};

		const res = await httpClient.sendRequest(request);
		return res;
	},
	unsubscribeWebhook: async (siteId: string, webhookId: string, accessToken: string) => {
		const request: HttpRequest = {
			method: HttpMethod.DELETE,
			url: `https://api.webflow.com/sites/${siteId}/webhooks/${webhookId}`,

			headers: {
				'Content-Type': 'application/json',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
		};
		return await httpClient.sendRequest(request);
	},
};
