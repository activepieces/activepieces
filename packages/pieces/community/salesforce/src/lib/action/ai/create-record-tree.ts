import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { recordsUtils } from '../../common/records';
import { createRecordTreeOutputSchema } from '../../output-schemas';

export const createRecordTree = createAction({
	auth: salesforceAuth,
	name: 'create_record_tree',
	classification: 'WRITE',
	displayName: 'Create Record Tree',
	description: 'Create parent records together with nested child records in one call.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates parent records of one object together with nested child records (e.g. an Account with its Contacts and Opportunities) in a single all-or-nothing call, returning the new id for each referenceId. Use it when children must be linked to parents created in the same step; for flat inserts use Create Records Batch. Limits: 200 records in total across all levels, up to 5 levels deep, insert only. Not idempotent: every call creates new records.',
		idempotent: false,
	},
	outputSchema: createRecordTreeOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Root Object',
			description: 'API name of the top-level records, e.g. Account.',
			required: true,
		}),
		records: Property.Json({
			displayName: 'Records',
			description:
				'JSON array of top-level records. Nest children under their relationship name, e.g. [{"Name": "Acme", "Contacts": {"records": [{"attributes": {"type": "Contact", "referenceId": "c1"}, "LastName": "Doe"}]}}]. Top-level attributes are filled in when omitted.',
			required: true,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Root Object' });
		const records = recordsUtils.parseRecordList({
			value: context.propsValue.records,
			fieldName: 'Records',
			max: recordsUtils.MAX_COMPOSITE_RECORDS,
		});
		const total = countTreeRecords(records);
		if (total > recordsUtils.MAX_COMPOSITE_RECORDS) {
			throw new Error(`A record tree can hold at most ${recordsUtils.MAX_COMPOSITE_RECORDS} records in total, including children; this one has ${total}.`);
		}
		const response = await callSalesforceApi<TreeResponse>(
			HttpMethod.POST,
			context.auth,
			`/services/data/v56.0/composite/tree/${object}`,
			{ records: records.map((record, index) => withAttributes({ record, object, index })) }
		);
		return {
			has_errors: response.body.hasErrors,
			results: response.body.results.map((result) => ({
				reference_id: result.referenceId,
				id: result.id ?? null,
				errors: (result.errors ?? []).map((error) => `${error.statusCode}: ${error.message}`).join('; '),
			})),
		};
	},
});

function countTreeRecords(records: unknown[]): number {
	return records.reduce<number>((total, record) => {
		if (!salesforceUtils.isRecord(record)) {
			return total + 1;
		}
		const nested = Object.values(record)
			.filter((value): value is Record<string, unknown> => salesforceUtils.isRecord(value) && Array.isArray(value['records']))
			.reduce<number>((sum, value) => sum + countTreeRecords(Array.isArray(value['records']) ? value['records'] : []), 0);
		return total + 1 + nested;
	}, 0);
}

function withAttributes({ record, object, index }: { record: Record<string, unknown>; object: string; index: number }) {
	const attributes = salesforceUtils.isRecord(record['attributes']) ? record['attributes'] : {};
	return {
		...record,
		attributes: { type: object, referenceId: `ref${index + 1}`, ...attributes },
	};
}

type TreeResponse = {
	hasErrors: boolean;
	results: {
		referenceId: string;
		id?: string;
		errors?: { statusCode: string; message: string; fields?: string[] }[];
	}[];
};
