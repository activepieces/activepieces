import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { searchRecordsSoslOutputSchema } from '../../output-schemas';

export const searchRecordsSosl = createAction({
	auth: salesforceAuth,
	name: 'search_records_sosl',
	classification: 'SEARCH',
	displayName: 'Search Records (SOSL)',
	description: 'Full-text search for a term across objects.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Full-text searches a word or phrase across all searchable fields of one or more objects (e.g. find "Acme" in Accounts, Contacts and Leads) and returns matches tagged with their object type. Use it when you only know a name, email or phrase and not which object or field holds it; for exact field filters use Run SOQL Query. The term needs at least 2 characters and results are capped by Limit (default 50, max 200). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: searchRecordsSoslOutputSchema,
	props: {
		search_term: Property.ShortText({
			displayName: 'Search Term',
			description: 'Word or phrase to search for, e.g. Acme or jane@example.com.',
			required: true,
		}),
		objects: Property.Array({
			displayName: 'Objects',
			description: 'Object API names to search, e.g. Account, Contact, Lead. Leave empty to search all searchable objects.',
			required: false,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Field API names to return for every object listed (Id is always returned), e.g. Name. Every field must exist on every listed object.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of records to return (default 50, max 200).',
			required: false,
			defaultValue: 50,
		}),
	},
	async run(context) {
		const term = context.propsValue.search_term.trim();
		if (term.length < 2) {
			throw new Error('Search Term must contain at least 2 characters.');
		}
		const objects = salesforceUtils
			.toStringArray(context.propsValue.objects)
			.map((object) => salesforceUtils.assertApiName({ value: object, fieldName: 'Objects' }));
		const fields = salesforceUtils
			.toStringArray(context.propsValue.fields)
			.map((field) => salesforceUtils.assertApiName({ value: field, fieldName: 'Fields' }))
			.filter((field) => field.toLowerCase() !== 'id');
		const limit = Math.min(Math.max(Math.floor(context.propsValue.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
		const selected = ['Id', ...fields].join(', ');
		const returning = objects.length > 0 ? ` RETURNING ${objects.map((object) => `${object}(${selected})`).join(', ')}` : '';
		const sosl = `FIND {${salesforceUtils.escapeSosl(term)}} IN ALL FIELDS${returning} LIMIT ${limit}`;
		const response = await callSalesforceApi<{ searchRecords?: unknown[] }>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/search?q=${encodeURIComponent(sosl)}`,
			undefined
		);
		const records = (response.body.searchRecords ?? []).map((record) => ({
			object_type: getObjectType(record),
			...toFlatRecord(record),
		}));
		return { records, count: records.length };
	},
});

function getObjectType(record: unknown): string | null {
	if (!salesforceUtils.isRecord(record) || !salesforceUtils.isRecord(record['attributes'])) {
		return null;
	}
	const type = record['attributes']['type'];
	return typeof type === 'string' ? type : null;
}

function toFlatRecord(record: unknown): Record<string, unknown> {
	const cleaned = salesforceUtils.cleanRecord(record);
	return salesforceUtils.isRecord(cleaned) ? cleaned : {};
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
