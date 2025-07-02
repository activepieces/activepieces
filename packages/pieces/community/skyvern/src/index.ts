import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { cancelRunAction } from './lib/actions/cancel-run';
import { findWorkflowAction } from './lib/actions/find-workflow';
import { getRunAction } from './lib/actions/get-run';
import { runAgentTaskAction } from './lib/actions/run-agent-task';
import { runWorkflowAction } from './lib/actions/run-workflow';
import { skyvernAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';

export const skyvern = createPiece({
	displayName: 'Skyvern',
	auth: skyvernAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/skyvern.jpg',
	authors: ['rimjhimyadav','kishanprmr'],
	actions: [
		runAgentTaskAction,
		runWorkflowAction,
		cancelRunAction,
		getRunAction,
		findWorkflowAction,
		createCustomApiCallAction({
			auth: skyvernAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					'x-api-key': auth as string,
				};
			},
		}),
	],
	triggers: [],
});
