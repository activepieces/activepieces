import { createAction, Property } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyMergeRecordsOutputSchema } from '../../output-schemas';

export const mergeRecordsAction = createAction({
	auth: twentyAuth,
	name: 'twenty_merge_records',
	outputSchema: twentyMergeRecordsOutputSchema,
	displayName: 'Merge Records',
	description: 'Merges 2 to 9 duplicate records of one object into one.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Merges 2 to 9 records of the same object into one: where fields conflict, the record at Conflict Priority Index wins, and the other records are permanently deleted (Restore Record cannot bring them back). Run it with Dry Run on first to preview the merged record, then again with Dry Run off. Find candidates with Find Duplicate Records. Needs update and delete permission.',
		idempotent: false,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		recordIds: twentyAiProps.recordIds({
			required: true,
			description:
				'UUIDs of the 2-9 records to merge, from List Records or Find Duplicate Records.',
		}),
		conflictPriorityIndex: Property.Number({
			displayName: 'Conflict Priority Index',
			description:
				'Zero-based position in Record IDs of the record whose values win when fields conflict, e.g. 0 for the first id.',
			required: true,
		}),
		dryRun: Property.Checkbox({
			displayName: 'Dry Run',
			description: 'Preview the merged record without changing anything. Defaults to false.',
			required: false,
		}),
	},
	async run(context) {
		const { objectNamePlural, recordIds, conflictPriorityIndex, dryRun } = context.propsValue;
		if (!recordIds.every((id): id is string => typeof id === 'string' && id !== '')) {
			throw new Error('Every item in Record IDs must be a non-empty string.');
		}
		return await twentyApi.mergeRecords({
			auth: context.auth,
			objectNamePlural,
			recordIds,
			conflictPriorityIndex,
			dryRun,
		});
	},
});
