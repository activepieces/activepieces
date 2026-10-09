import type { AppConnectionType } from '@activepieces/pieces-framework';

export type FlowiseAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { base_url: string; access_token: string };
};

export type FlowisePrediction = {
	text?: string;
	question?: string;
	chatId?: string;
	chatMessageId?: string;
	sessionId?: string;
};
