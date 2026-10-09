import { HttpMethod } from '@activepieces/pieces-common';

import { flowiseClient } from './client';

import type { FlowiseAuthValue, FlowisePrediction } from './types';

async function createPrediction({
	auth,
	chatflowId,
	question,
	history,
	overrideConfig,
}: CreatePredictionParams & { auth: FlowiseAuthValue }): Promise<FlowisePrediction> {
	return await flowiseClient.request<FlowisePrediction>({
		auth,
		method: HttpMethod.POST,
		path: `/api/v1/prediction/${chatflowId}`,
		headers: { 'Content-Type': 'application/json' },
		body: { question, history, overrideConfig },
	});
}

export const flowiseApi = { createPrediction };

type CreatePredictionParams = {
	chatflowId: string;
	question: string;
	history?: unknown;
	overrideConfig?: unknown;
};
