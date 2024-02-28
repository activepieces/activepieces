import { activeCampaignAuth } from '../../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { CreateAccountRequest } from '../../common/types';

export const createAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_account',
	displayName: 'Create Account',
	description: 'Creates a new account.',
	props: {
		name: Property.ShortText({
			displayName: 'Account Name',
			required: true,
		}),
		accountUrl: Property.ShortText({
			displayName: 'Account URL',
			required: false,
		}),
		accountCustomFields: activecampaignCommon.accountCustomFields,
	},
	async run(context) {
		const { name, accountUrl, accountCustomFields } = context.propsValue;
		const createAccountParams: CreateAccountRequest = {
			name,
			accountUrl,
			fields: [],
		};

		Object.entries(accountCustomFields).forEach(([key, value]) => {
			createAccountParams.fields?.push({ customFieldId: Number(key), fieldValue: value });
		});

		const client = makeClient(context.auth);
		return await client.createAccount(createAccountParams);
	},
});
