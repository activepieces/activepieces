import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { CompositeResult, recordsUtils } from '../../common/records';
import { compositeBatchOutputSchema } from '../../output-schemas';

export const deleteRecordsBatch = createAction({
	auth: salesforceAuth,
	name: 'delete_records_batch',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Records Batch',
	description: 'Delete up to 200 records in one call.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes up to 200 Salesforce records by id in a single call (ids may belong to different objects) and returns a per-record result in input order; deleted records go to the Recycle Bin. For a single record use Delete Record. With All or None on, one failure rolls back every delete. Not idempotent: already-deleted ids fail on a second call.',
		idempotent: false,
	},
	outputSchema: compositeBatchOutputSchema,
	props: {
		record_ids: Property.Array({
			displayName: 'Record IDs',
			description: 'Up to 200 record ids to delete.',
			required: true,
		}),
		all_or_none: Property.Checkbox({
			displayName: 'All or None',
			description: 'Roll back every delete if any delete fails.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const ids = recordsUtils.parseIdList({
			value: context.propsValue.record_ids,
			fieldName: 'Record IDs',
			max: recordsUtils.MAX_COMPOSITE_RECORDS,
		});
		const allOrNone = context.propsValue.all_or_none ?? false;
		const response = await callSalesforceApi<CompositeResult[]>(
			HttpMethod.DELETE,
			context.auth,
			`/services/data/v56.0/composite/sobjects?ids=${ids.join(',')}&allOrNone=${allOrNone}`,
			undefined
		);
		return recordsUtils.formatCompositeResults(response.body);
	},
});
