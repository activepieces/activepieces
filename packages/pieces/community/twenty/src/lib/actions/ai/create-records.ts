import { createAction, Property } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyCreateRecordsOutputSchema } from '../../output-schemas';

export const createRecordsAction = createAction({
	auth: twentyAuth,
	name: 'twenty_create_records',
	outputSchema: twentyCreateRecordsOutputSchema,
	displayName: 'Create Records',
	description: 'Creates up to 60 records of one object in a single call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates 1 to 60 records of the same object in one call, each a JSON object of field values (same format as Create Record). Prefer it over repeated Create Record calls for imports. The batch succeeds or fails as a whole. Not idempotent unless Upsert is on.',
		idempotent: false,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		records: Property.Array({
			displayName: 'Records',
			description:
				'Array of 1-60 JSON objects of field values, e.g. [{"name": "Acme"}, {"name": "Globex"}].',
			required: true,
		}),
		upsert: Property.Checkbox({
			displayName: 'Upsert',
			description:
				'Update existing records instead of creating duplicates when a unique field already matches. Defaults to false.',
			required: false,
		}),
	},
	async run(context) {
		const { objectNamePlural, records, upsert } = context.propsValue;
		if (records.length === 0 || records.length > MAX_RECORDS) {
			throw new Error(`Records must contain between 1 and ${MAX_RECORDS} items.`);
		}
		if (
			!records.every(
				(item): item is Record<string, unknown> =>
					typeof item === 'object' && item !== null && !Array.isArray(item),
			)
		) {
			throw new Error('Every item in Records must be a JSON object of field values.');
		}
		return await twentyApi.createRecords({ auth: context.auth, objectNamePlural, records, upsert });
	},
});

const MAX_RECORDS = 60;
