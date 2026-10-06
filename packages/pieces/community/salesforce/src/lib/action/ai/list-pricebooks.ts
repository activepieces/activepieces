import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { listPricebooksOutputSchema } from '../../output-schemas';

export const listPricebooks = createAction({
	auth: salesforceAuth,
	name: 'list_pricebooks',
	classification: 'READ',
	displayName: 'List Price Books',
	description: 'List price books and, optionally, their product entries.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Salesforce price books (id, name, active, standard) and, when Include Entries is on, their price book entries with product name, code and list price, filtered by price book id and product name. Use it to find the Price Book ID for Create Opportunity and the Price Book Entry ID for Add Opportunity Product. Each list returns at most 200 rows (default 50). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listPricebooksOutputSchema,
	props: {
		pricebook_id: Property.ShortText({ displayName: 'Price Book ID', description: 'Only this price book.', required: false }),
		active_only: Property.Checkbox({ displayName: 'Active Only', required: false, defaultValue: false }),
		include_entries: Property.Checkbox({ displayName: 'Include Entries', description: 'Also return product entries.', required: false, defaultValue: false }),
		product_name: Property.ShortText({ displayName: 'Product Name Contains', description: 'Filters entries.', required: false }),
		limit: crmUtils.limitProp,
	},
	async run(context) {
		const { pricebook_id, active_only, include_entries, product_name, limit } = context.propsValue;
		const activeFilter = active_only ? true : undefined;
		const pricebooks = await crmUtils.searchRecords({
			auth: context.auth,
			object: 'Pricebook2',
			fields: ['Id', 'Name', 'IsActive', 'IsStandard', 'Description'],
			conditions: [crmUtils.idEquals({ field: 'Id', value: pricebook_id }), crmUtils.booleanEquals({ field: 'IsActive', value: activeFilter })],
			orderBy: 'Name ASC',
			limit,
		});
		if (!include_entries) {
			return { pricebooks, entries: null };
		}
		const entries = await crmUtils.searchRecords({
			auth: context.auth,
			object: 'PricebookEntry',
			fields: ['Id', 'Pricebook2Id', 'Product2Id', 'Product2.Name', 'ProductCode', 'UnitPrice', 'IsActive'],
			conditions: [
				crmUtils.idEquals({ field: 'Pricebook2Id', value: pricebook_id }),
				crmUtils.contains({ field: 'Product2.Name', value: product_name }),
				crmUtils.booleanEquals({ field: 'IsActive', value: activeFilter }),
			],
			orderBy: 'Product2.Name ASC',
			limit,
		});
		return { pricebooks, entries };
	},
});
