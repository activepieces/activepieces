import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateAccountOutputSchema } from '../../../output-schemas';

export const createAccountAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_account',
	outputSchema: quickbooksSandboxCreateAccountOutputSchema,
	displayName: 'Create Account',
	description: 'Creates an account in the chart of accounts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a chart-of-accounts entry (e.g. a bank, expense or income account). Needs a unique name and an account type or sub-type; for a sub-account pass the parent id from List Accounts. Not idempotent: each call creates a new account, and a duplicate name is rejected.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Account name, unique among accounts. No colons or double quotes.',
			required: true,
		}),
		accountType: quickbooksAiProps.accountType({
			required: false,
			displayName: 'Account Type',
			description: 'QuickBooks account type. Set this or Account Sub-Type.',
		}),
		accountSubType: Property.ShortText({
			displayName: 'Account Sub-Type',
			description: 'QuickBooks account sub-type matching the type, e.g. "Checking", "Savings", "OfficeGeneralAdministrativeExpenses", "SalesOfProductIncome".',
			required: false,
		}),
		acctNum: Property.ShortText({
			displayName: 'Account Number',
			description: 'User-defined account number, unique among accounts.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Description of the account.',
			required: false,
		}),
		parentAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Parent Account ID',
			description: 'Makes this a sub-account of the given account, which must have the same type. Use List Accounts to find it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { name, accountType, accountSubType, acctNum, description, parentAccountId, additionalFields } =
			context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Account',
			body: {
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
					},
				}),
			},
		});
	},
});

