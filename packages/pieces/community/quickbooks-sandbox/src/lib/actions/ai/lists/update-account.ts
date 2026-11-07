import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxGetAccountOutputSchema } from '../../../output-schemas';

export const updateAccountAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_account',
	outputSchema: quickbooksSandboxGetAccountOutputSchema,
	displayName: 'Update Account',
	description: 'Changes fields of an existing account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one account: it reads the current account and sends it back with your changes, so unset fields keep their values. Accounts cannot be deleted; set Active to No to deactivate one (it must have a zero balance). Get the id from List Accounts.',
		idempotent: true,
	},
	props: {
		accountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Account ID',
			description: 'QuickBooks account id. Use List Accounts to find it.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New account name, unique among accounts.',
			required: false,
		}),
		accountType: quickbooksAiProps.accountType({
			required: false,
			displayName: 'Account Type',
			description: 'New QuickBooks account type.',
		}),
		accountSubType: Property.ShortText({
			displayName: 'Account Sub-Type',
			description: 'New account sub-type matching the type, e.g. "Checking".',
			required: false,
		}),
		acctNum: Property.ShortText({ displayName: 'Account Number', description: 'New account number.', required: false }),
		description: Property.LongText({ displayName: 'Description', description: 'New description.', required: false }),
		parentAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Parent Account ID',
			description: 'Moves this account under the given parent account. Use List Accounts to find it.',
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'No deactivates the account (the way to remove it); Yes reactivates it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { accountId, name, accountType, accountSubType, acctNum, description, parentAccountId, active, additionalFields } =
			context.propsValue;
		const fields = quickbooksUtils.requireChanges({
			fields: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Name: name,
						AccountType: accountType,
						AccountSubType: accountSubType,
						AcctNum: acctNum,
						Description: description,
						SubAccount: parentAccountId ? true : undefined,
						ParentRef: quickbooksUtils.ref({ value: parentAccountId }),
						Active: active ? active === 'true' : undefined,
					},
				}),
			},
		});
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'Account', id: accountId, fields });
	},
});
