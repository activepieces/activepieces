import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskUpdateManyAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateManyAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_many_accounts',
	outputSchema: zohoDeskUpdateManyAccountsOutputSchema,
	displayName: 'Update Many Accounts',
	description: 'Sets one field to the same value on several accounts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Sets one field (by API name) to the same value on several accounts at once.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountIds: Property.Array({
			displayName: 'Account IDs',
			description: 'Account IDs to update.',
			required: true,
		}),
		fieldName: Property.ShortText({
			displayName: 'Field Name',
			description: 'API name of the field to set (from List Fields, module accounts).',
			required: true,
		}),
		fieldValue: Property.ShortText({
			displayName: 'Field Value',
			description: 'Value to set. Leave empty to clear the field.',
			required: false,
		}),
		isCustomField: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Custom Field',
			description: 'Yes when Field Name is a custom field.',
		}),
	},
	async run(context) {
		const { orgId, accountIds, fieldName, fieldValue, isCustomField } = context.propsValue;
		return await zohoDeskApi.updateManyAccounts({
			auth: context.auth,
			orgId,
			accountIds: zohoDeskUtils.requiredStringList({ value: accountIds, propName: 'Account IDs' }),
			fieldName,
			fieldValue,
			isCustomField,
		});
	},
});
