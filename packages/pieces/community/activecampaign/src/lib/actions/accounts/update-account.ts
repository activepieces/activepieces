import { activeCampaignAuth } from '../../auth';
import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { accountOutputSchema } from '../../common/output-schemas';
import { CreateAccountRequest } from '../../common/types';

export const updateAccountAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_account',
	classification: 'WRITE',
	displayName: 'Update Account',
	description: "Updates an account's details and custom fields.",
	audience: 'human',
	aiMetadata: { description: 'Updates an existing ActiveCampaign account identified by account ID, changing its name, URL, and/or custom field values. Use when you already have the target account ID and want to modify its details. Idempotent: re-running with the same input leaves the account in the same state.', idempotent: true },
	outputSchema: accountOutputSchema,
	propertyGroups: [
		{ key: 'account', display: 'section', label: 'Account to Update', icon: 'users', props: ['accountId', 'emptyFieldsNote'] },
		{ key: 'changes', display: 'section', label: 'Changes', icon: 'text', props: ['name', 'accountUrl', 'accountCustomFields'] },
	],
	props: {
		accountId: activecampaignCommon.accountId,
		emptyFieldsNote: Property.MarkDown({
			value: 'Fields left empty keep their current value.',
			variant: MarkdownVariant.INFO,
		}),
		name: Property.ShortText({
			displayName: 'Account Name',
			placeholder: 'Acme Inc',
			required: false,
		}),
		accountUrl: Property.ShortText({
			displayName: 'Website',
			placeholder: 'https://acme.com',
			required: false,
		}),
		accountCustomFields: activecampaignCommon.accountCustomFields,
	},
	async run(context) {
		const { accountId, name, accountUrl, accountCustomFields } = context.propsValue;
		const updateAccountParams: Partial<CreateAccountRequest> = {
			...(isFilled(name) ? { name } : {}),
			...(isFilled(accountUrl) ? { accountUrl } : {}),
			fields: Object.entries(accountCustomFields ?? {})
				.filter(([, value]) => isFilled(value))
				.map(([key, value]) => ({ customFieldId: Number(key), fieldValue: value })),
		};

		const client = makeClient(context.auth.props);
		return await client.updateAccount({ accountId, account: updateAccountParams });
	},
});

function isFilled(value: unknown): boolean {
	if (value === undefined || value === null || value === '') return false;
	return !(Array.isArray(value) && value.length === 0);
}
