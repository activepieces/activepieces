import { createAction } from '@activepieces/pieces-framework';
import { manychatAuth } from '../../auth';
import { manychatClient, manychatUtils } from '../../common/client';
import { manychatOutputSchemas } from '../../common/output-schemas';

export const getPageInfoAiAction = createAction({
	auth: manychatAuth,
	name: 'get_page_info',
	classification: 'READ',
	displayName: 'Get Account Info',
	description: 'Gets the connected ManyChat account (page) details.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets the connected ManyChat account: name, whether it is on Pro, its timezone, and the Facebook page ID, username and details (empty when the account has no Facebook page, for example Telegram-only). Use the timezone to choose the UTC offset for datetime values in "Set Subscriber Custom Fields". Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.page,
	props: {},
	async run({ auth }) {
		const data = manychatUtils.dataOf(await manychatClient.request({ apiKey: manychatUtils.apiKeyOf(auth), method: 'GET', path: '/page/getInfo', operation: 'get account info' }));
		if (!manychatUtils.isRecord(data)) {
			throw new Error('ManyChat returned no account details.');
		}
		return data;
	},
});
