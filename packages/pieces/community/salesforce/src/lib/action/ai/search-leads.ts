import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { searchLeadsOutputSchema } from '../../output-schemas';

export const searchLeads = createAction({
	auth: salesforceAuth,
	name: 'search_leads',
	classification: 'SEARCH',
	displayName: 'Search Leads',
	description: 'Find leads by name, email, company, status, source or conversion.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds Salesforce Leads matching all the filters you give (name contains, exact email, company contains, status, lead source, converted yes/no), newest-modified first; with no filters it lists recent leads. Use it to get a lead id before Update Lead or Add Lead to Campaign; for contacts use Search Contacts. Returns at most 200 rows (default 50). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: searchLeadsOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name Contains', required: false }),
		email: Property.ShortText({ displayName: 'Email', description: 'Exact email address.', required: false }),
		company: Property.ShortText({ displayName: 'Company Contains', required: false }),
		status: Property.ShortText({ displayName: 'Status', required: false }),
		lead_source: Property.ShortText({ displayName: 'Lead Source', required: false }),
		is_converted: crmUtils.booleanFilterProp({ displayName: 'Converted', description: 'Leave empty for both converted and unconverted leads.' }),
		limit: crmUtils.limitProp,
	},
	async run(context) {
		const { name, email, company, status, lead_source, is_converted, limit } = context.propsValue;
		return crmUtils.searchRecords({
			auth: context.auth,
			object: 'Lead',
			fields: ['Id', 'FirstName', 'LastName', 'Name', 'Company', 'Email', 'Phone', 'Title', 'Status', 'LeadSource', 'Industry', 'IsConverted', 'ConvertedContactId', 'ConvertedAccountId', 'OwnerId', 'CreatedDate', 'LastModifiedDate'],
			conditions: [
				crmUtils.contains({ field: 'Name', value: name }),
				crmUtils.equals({ field: 'Email', value: email }),
				crmUtils.contains({ field: 'Company', value: company }),
				crmUtils.equals({ field: 'Status', value: status }),
				crmUtils.equals({ field: 'LeadSource', value: lead_source }),
				crmUtils.booleanEquals({ field: 'IsConverted', value: is_converted }),
			],
			orderBy: 'LastModifiedDate DESC',
			limit,
		});
	},
});
