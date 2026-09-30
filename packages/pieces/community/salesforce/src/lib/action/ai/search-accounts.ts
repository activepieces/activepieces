import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { searchAccountsOutputSchema } from '../../output-schemas';

export const searchAccounts = createAction({
	auth: salesforceAuth,
	name: 'search_accounts',
	classification: 'SEARCH',
	displayName: 'Search Accounts',
	description: 'Find accounts by name, industry, type, location or owner.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds Salesforce Accounts matching all the filters you give (name contains, exact industry, type, billing city/country, owner id), newest-modified first; with no filters it lists recent accounts. Use it to get an account id before Update Account or to link contacts and opportunities; for arbitrary conditions use a SOQL query action instead. Returns at most 200 rows (default 50). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: searchAccountsOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name Contains', required: false }),
		industry: Property.ShortText({ displayName: 'Industry', required: false }),
		type: Property.ShortText({ displayName: 'Type', required: false }),
		billing_city: Property.ShortText({ displayName: 'Billing City', required: false }),
		billing_country: Property.ShortText({ displayName: 'Billing Country', required: false }),
		owner_id: Property.ShortText({ displayName: 'Owner ID', required: false }),
		limit: crmUtils.limitProp,
	},
	async run(context) {
		const { name, industry, type, billing_city, billing_country, owner_id, limit } = context.propsValue;
		return crmUtils.searchRecords({
			auth: context.auth,
			object: 'Account',
			fields: ['Id', 'Name', 'Phone', 'Website', 'Industry', 'Type', 'BillingCity', 'BillingState', 'BillingCountry', 'OwnerId', 'ParentId', 'CreatedDate', 'LastModifiedDate'],
			conditions: [
				crmUtils.contains({ field: 'Name', value: name }),
				crmUtils.equals({ field: 'Industry', value: industry }),
				crmUtils.equals({ field: 'Type', value: type }),
				crmUtils.equals({ field: 'BillingCity', value: billing_city }),
				crmUtils.equals({ field: 'BillingCountry', value: billing_country }),
				crmUtils.idEquals({ field: 'OwnerId', value: owner_id }),
			],
			orderBy: 'LastModifiedDate DESC',
			limit,
		});
	},
});
