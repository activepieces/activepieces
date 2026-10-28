import { createAction } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyUpdateRecordOutputSchema } from '../../output-schemas';

export const updateRecordAction = createAction({
	auth: twentyAuth,
	name: 'twenty_update_record',
	outputSchema: twentyUpdateRecordOutputSchema,
	displayName: 'Update Record',
	description: 'Updates fields on one record of any object.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates one record by its UUID (from List Records), changing only the fields present in the JSON; other fields stay as they are. A composite field (name, emails, address, amount) is replaced as a whole, so send all of its sub-fields. Set a field to null to clear it.',
		idempotent: true,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		recordId: twentyAiProps.recordId({ required: true }),
		record: twentyAiProps.record({
			required: true,
			displayName: 'Changes',
			description:
				'Fields to change, as a JSON object keyed by field name (same format as Create Record), e.g. {"stage": "PROPOSAL"} or {"jobTitle": null} to clear a field.',
		}),
	},
	async run(context) {
		const { objectNamePlural, recordId, record } = context.propsValue;
		return await twentyApi.updateRecord({ auth: context.auth, objectNamePlural, recordId, record });
	},
});
