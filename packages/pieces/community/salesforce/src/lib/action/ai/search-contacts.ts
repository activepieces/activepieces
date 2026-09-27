import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { searchContactsOutputSchema } from '../../output-schemas';

export const searchContacts = createAction({
	auth: salesforceAuth,
	name: 'search_contacts',
	classification: 'SEARCH',
	displayName: 'Search Contacts',
	description: 'Find contacts by name, email, account or title.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds Salesforce Contacts matching all the filters you give (name contains, exact email, account id, title contains), newest-modified first; with no filters it lists recent contacts. Use it to get a contact id before Update Contact, Add Contact to Campaign or Create Task; for leads use Search Leads. Returns at most 200 rows (default 50). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: searchContactsOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name Contains', required: false }),
		email: Property.ShortText({ displayName: 'Email', description: 'Exact email address.', required: false }),
		account_id: Property.ShortText({ displayName: 'Account ID', required: false }),
		title: Property.ShortText({ displayName: 'Title Contains', required: false }),
		limit: crmUtils.limitProp,
	},
	async run(context) {
		const { name, email, account_id, title, limit } = context.propsValue;
		return crmUtils.searchRecords({
			auth: context.auth,
			object: 'Contact',
			fields: ['Id', 'FirstName', 'LastName', 'Name', 'Email', 'Phone', 'MobilePhone', 'Title', 'Department', 'AccountId', 'Account.Name', 'OwnerId', 'CreatedDate', 'LastModifiedDate'],
			conditions: [
				crmUtils.contains({ field: 'Name', value: name }),
				crmUtils.equals({ field: 'Email', value: email }),
				crmUtils.idEquals({ field: 'AccountId', value: account_id }),
				crmUtils.contains({ field: 'Title', value: title }),
			],
			orderBy: 'LastModifiedDate DESC',
			limit,
		});
	},
});
