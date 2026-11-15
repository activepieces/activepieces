import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { searchOpportunitiesOutputSchema } from '../../output-schemas';

export const searchOpportunities = createAction({
	auth: salesforceAuth,
	name: 'search_opportunities',
	classification: 'SEARCH',
	displayName: 'Search Opportunities',
	description: 'Find opportunities by name, account, stage, status, close date or amount.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds Salesforce Opportunities matching all the filters you give (name contains, account id, exact stage, closed / won yes-no, close date range in YYYY-MM-DD, minimum amount), newest-modified first; with no filters it lists recent opportunities. Use it to get an opportunity id before Update Opportunity or Add Opportunity Product, or to review a pipeline. Returns at most 200 rows (default 50). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: searchOpportunitiesOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name Contains', required: false }),
		account_id: Property.ShortText({ displayName: 'Account ID', required: false }),
		stage: Property.ShortText({ displayName: 'Stage', required: false }),
		is_closed: crmUtils.booleanFilterProp({ displayName: 'Closed', description: 'Leave empty for open and closed.' }),
		is_won: crmUtils.booleanFilterProp({ displayName: 'Won', description: 'Leave empty for won and not won.' }),
		close_date_from: Property.ShortText({ displayName: 'Close Date From', description: 'YYYY-MM-DD, inclusive.', required: false }),
		close_date_to: Property.ShortText({ displayName: 'Close Date To', description: 'YYYY-MM-DD, inclusive.', required: false }),
		min_amount: Property.Number({ displayName: 'Minimum Amount', required: false }),
		limit: crmUtils.limitProp,
	},
	async run(context) {
		const { name, account_id, stage, is_closed, is_won, close_date_from, close_date_to, min_amount, limit } = context.propsValue;
		return crmUtils.searchRecords({
			auth: context.auth,
			object: 'Opportunity',
			fields: ['Id', 'Name', 'AccountId', 'Account.Name', 'StageName', 'Amount', 'Probability', 'CloseDate', 'IsClosed', 'IsWon', 'Type', 'LeadSource', 'NextStep', 'Pricebook2Id', 'OwnerId', 'CreatedDate', 'LastModifiedDate'],
			conditions: [
				crmUtils.contains({ field: 'Name', value: name }),
				crmUtils.idEquals({ field: 'AccountId', value: account_id }),
				crmUtils.equals({ field: 'StageName', value: stage }),
				crmUtils.booleanEquals({ field: 'IsClosed', value: is_closed }),
				crmUtils.booleanEquals({ field: 'IsWon', value: is_won }),
				crmUtils.dateCompare({ field: 'CloseDate', operator: '>=', value: close_date_from }),
				crmUtils.dateCompare({ field: 'CloseDate', operator: '<=', value: close_date_to }),
				crmUtils.numberCompare({ field: 'Amount', operator: '>=', value: min_amount }),
			],
			orderBy: 'LastModifiedDate DESC',
			limit,
		});
	},
});
