import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetBalanceAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_balance',
	displayName: 'Get Balance',
	description: 'Gets the account balance and available credit.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the account balance, pending amount, credit limit, available credit and currency. Use it to check funds before billable actions such as sending messages or ordering numbers.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await telnyxApi.getBalance({ auth: context.auth });
	},
});
