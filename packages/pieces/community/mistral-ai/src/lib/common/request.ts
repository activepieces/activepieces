import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import type { mistralAuth } from './auth';

export type MistralAuthValue = AppConnectionValueForAuthProperty<typeof mistralAuth>;

function isGatewayAuth(auth: MistralAuth): auth is MistralGatewayAuth {
	return auth.type === AppConnectionType.CUSTOM_AUTH;
}

function getConfig(auth: MistralAuthValue): MistralRequestConfig {
	const a = auth as MistralAuth;
	if (isGatewayAuth(a)) {
		const { accountId, gatewayId, gatewayAuthToken, mistralApiKey } = a.props;
		const headers: Record<string, string> = {};
		if (gatewayAuthToken) {
			headers['cf-aig-authorization'] = `Bearer ${gatewayAuthToken}`;
		}
		if (mistralApiKey) {
			headers['Authorization'] = `Bearer ${mistralApiKey}`;
		}
		return {
			baseUrl: `https://gateway.ai.cloudflare.com/v1/${encodeURIComponent(accountId)}/${encodeURIComponent(gatewayId)}/mistral/v1`,
			headers,
		};
	}
	return {
		baseUrl: 'https://api.mistral.ai/v1',
		headers: { Authorization: `Bearer ${a.secret_text}` },
	};
}

export const mistralRequest = { getConfig };

type MistralDirectAuth = {
	type: AppConnectionType.SECRET_TEXT;
	secret_text: string;
};

type MistralGatewayAuth = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: {
		accountId: string;
		gatewayId: string;
		gatewayAuthToken?: string;
		mistralApiKey?: string;
	};
};

type MistralAuth = MistralDirectAuth | MistralGatewayAuth;

export type MistralRequestConfig = {
	baseUrl: string;
	headers: Record<string, string>;
};
