import { activeCampaignAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { CreateAccountRequest } from '../../common/types';

export const updateAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_account',
	displayName: 'Update Account',
	description: 'Updates an account.',
	audience: 'both',
	aiMetadata: { description: 'Updates an existing ActiveCampaign account identified by account ID, changing its name, URL, and/or custom field values. Use when you already have the target account ID and want to modify its details. Idempotent: re-running with the same input leaves the account in the same state.', idempotent: true },
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

		const client = makeClient(context.auth.props);
		return await client.updateAccount(Number(accountId), updateAccountParams);
	},
});
