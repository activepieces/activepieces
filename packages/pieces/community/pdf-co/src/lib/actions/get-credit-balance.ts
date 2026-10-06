import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoOutputSchemas } from '../output-schemas';

export const getCreditBalance = createAction({
	auth: pdfCoAuth,
	name: 'get_credit_balance',
	displayName: 'Get Credit Balance',
	description: 'Get the number of PDF.co credits left on the account.',
	audience: 'both',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the remaining PDF.co credits of the connected account. Use before a large batch to avoid "not enough credits" (402) failures. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.creditBalance,
	props: {},
	async run({ auth }) {
		const body = await pdfCoClient.request<unknown>({
			apiKey: pdfCoClient.apiKeyOf(auth),
			method: HttpMethod.GET,
			path: '/v1/account/credit/balance',
		});
		const remaining = pdfCoClient.readRecord(body)['remainingCredits'];
		return { remaining_credits: typeof remaining === 'number' ? remaining : undefined };
	},
});
