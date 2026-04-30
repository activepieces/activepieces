import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const mistralDirectAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `You can obtain your API key from the Mistral AI dashboard. Go to https://console.mistral.ai, generate an API key, and paste it here.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: 'https://api.mistral.ai/v1/models',
				headers: {
					Authorization: `Bearer ${auth}`,
				},
			});
			return { valid: true };
		} catch (e: any) {
			if (e.response?.status === 401) {
				return { valid: false, error: 'Invalid API key. Please check your API key and try again.' };
			}
			if (e.response?.status === 429) {
				return { valid: false, error: 'Rate limit exceeded. Please wait and try again.' };
			}
			if (e.message?.toLowerCase().includes('network')) {
				return { valid: false, error: 'Network error. Please check your internet connection.' };
			}
			return { valid: false, error: 'Authentication failed: ' + (e.message || 'Unknown error') };
		}
	},
});

const mistralCloudflareGatewayAuth = PieceAuth.CustomAuth({
	displayName: 'Cloudflare AI Gateway',
	description:
		'Route Mistral calls through your Cloudflare AI Gateway. Provide a Mistral API key (key-in-request mode) or leave it blank if your gateway has Mistral configured as a stored key (BYOK).',
	required: true,
	props: {
		accountId: Property.ShortText({
			displayName: 'Cloudflare Account ID',
			description: 'Your Cloudflare account ID (visible on the AI Gateway dashboard).',
			required: true,
		}),
		gatewayId: Property.ShortText({
			displayName: 'Gateway ID',
			description: 'The slug of your AI Gateway (visible on the gateway settings page).',
			required: true,
		}),
		gatewayAuthToken: PieceAuth.SecretText({
			displayName: 'Gateway Auth Token',
			description: 'Optional. Required only if your gateway has authentication enabled. Sent as cf-aig-authorization.',
			required: false,
		}),
		mistralApiKey: PieceAuth.SecretText({
			displayName: 'Mistral API Key',
			description:
				'Optional. Provide your Mistral key for key-in-request mode. Leave blank if Cloudflare injects the key via stored credentials (BYOK).',
			required: false,
		}),
	},
	validate: async ({ auth }) => {
		const { accountId, gatewayId, gatewayAuthToken, mistralApiKey } = auth as GatewayAuthProps;

		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `https://gateway.ai.cloudflare.com/v1/${encodeURIComponent(accountId)}/${encodeURIComponent(gatewayId)}/mistral/v1/models`,
				headers: buildGatewayHeaders({ gatewayAuthToken, mistralApiKey }),
			});
			return { valid: true };
		} catch (e: any) {
			const status = e.response?.status;
			if (status === 401 || status === 403) {
				return { valid: false, error: 'Authentication rejected by the gateway. Check your Mistral key and gateway auth token.' };
			}
			if (status === 404) {
				return { valid: false, error: 'Gateway not found. Check your account ID and gateway ID.' };
			}
			if (status === 429) {
				return { valid: false, error: 'Rate limit exceeded at the gateway. Please wait and try again.' };
			}
			return { valid: false, error: 'Gateway validation failed: ' + (e.message || 'Unknown error') };
		}
	},
});

export const mistralAuth = [mistralDirectAuth, mistralCloudflareGatewayAuth];

function buildGatewayHeaders({ gatewayAuthToken, mistralApiKey }: { gatewayAuthToken?: string; mistralApiKey?: string }): Record<string, string> {
	const headers: Record<string, string> = {};
	if (gatewayAuthToken) {
		headers['cf-aig-authorization'] = `Bearer ${gatewayAuthToken}`;
	}
	if (mistralApiKey) {
		headers['Authorization'] = `Bearer ${mistralApiKey}`;
	}
	return headers;
}

type GatewayAuthProps = {
	accountId: string;
	gatewayId: string;
	gatewayAuthToken?: string;
	mistralApiKey?: string;
};
