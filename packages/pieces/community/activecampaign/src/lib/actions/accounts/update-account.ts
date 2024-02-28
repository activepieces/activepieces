import { activeCampaignAuth } from '../../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { CreateAccountRequest } from '../../common/types';

export const updateAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_account',
	displayName: 'Update Account',
	description: 'Updates an account.',
	props: {
		accountId: activecampaignCommon.accountId,
		name: Property.ShortText({
			displayName: 'Account Name',
			required: false,
		}),
		accountUrl: Property.ShortText({
			displayName: 'Account URL',
			required: false,
		}),
		accountCustomFields: activecampaignCommon.accountCustomFields,
	},
	async run(context) {
		const { accountId, name, accountUrl, accountCustomFields } = context.propsValue;
		const updateAccountParams: Partial<CreateAccountRequest> = {
			name,
			accountUrl,
			fields: [],
		};

		Object.entries(accountCustomFields).forEach(([key, value]) => {
			updateAccountParams.fields?.push({ customFieldId: Number(key), fieldValue: value });
		});

		const client = makeClient(context.auth);
		return await client.updateAccount(Number(accountId), updateAccountParams);
	},
});
