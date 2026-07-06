import { activeCampaignAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { CreateAccountRequest } from '../../common/types';

export const createAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_account',
	displayName: 'Create Account',
	description: 'Creates a new account.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new ActiveCampaign account (CRM organization/company record) with a name and optional URL and custom field values. Use when you need to register a company in the CRM before associating contacts or deals with it. Not idempotent: each call creates a separate account even with identical input, so it can produce duplicates.', idempotent: false },
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

		const client = makeClient(context.auth.props);
		return await client.createAccount(createAccountParams);
	},
});
