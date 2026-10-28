import { createAction, Property } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyFindDuplicateRecordsOutputSchema } from '../../output-schemas';

export const findDuplicateRecordsAction = createAction({
	auth: twentyAuth,
	name: 'twenty_find_duplicate_records',
	outputSchema: twentyFindDuplicateRecordsOutputSchema,
	displayName: 'Find Duplicate Records',
	description: 'Finds likely duplicates of existing records or of candidate record data.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Finds records that Twenty's duplicate rules (e.g. same email, domain or name) consider duplicates, either of existing records (Record IDs) or of candidate data before creating it (Records). Pass exactly one of the two. Returns one result per input, in order. Use before Create Record to avoid duplicates, or before Merge Records.",
		idempotent: true,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		recordIds: twentyAiProps.recordIds({
			required: false,
			description:
				'UUIDs of existing records to check for duplicates, from List Records. Leave empty when passing Records.',
		}),
		records: Property.Array({
			displayName: 'Records',
			description:
				'Candidate records to check before creating them, as JSON objects of field values, e.g. [{"emails": {"primaryEmail": "ada@example.com"}}]. Leave empty when passing Record IDs.',
			required: false,
		}),
	},
	async run(context) {
		const { objectNamePlural, recordIds, records } = context.propsValue;
		const ids = recordIds ?? [];
		const candidates = records ?? [];
		if (ids.length > 0 === candidates.length > 0) {
			throw new Error('Pass exactly one of Record IDs or Records.');
		}
		if (!ids.every((id): id is string => typeof id === 'string' && id !== '')) {
			throw new Error('Every item in Record IDs must be a non-empty string.');
		}
		if (
			!candidates.every(
				(item): item is Record<string, unknown> =>
					typeof item === 'object' && item !== null && !Array.isArray(item),
			)
		) {
			throw new Error('Every item in Records must be a JSON object of field values.');
		}
		return await twentyApi.findDuplicateRecords({
			auth: context.auth,
			objectNamePlural,
			recordIds: ids.length > 0 ? ids : undefined,
			records: candidates.length > 0 ? candidates : undefined,
		});
	},
});
