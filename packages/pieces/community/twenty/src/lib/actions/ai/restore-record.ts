import { createAction } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyRestoreRecordOutputSchema } from '../../output-schemas';

export const restoreRecordAction = createAction({
	auth: twentyAuth,
	name: 'twenty_restore_record',
	outputSchema: twentyRestoreRecordOutputSchema,
	displayName: 'Restore Record',
	description: 'Restores a soft-deleted record.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Restores one soft-deleted record (deleted by Delete Record without Permanent) by its UUID. Find soft-deleted ids with List Records and the filter deletedAt[is]:NOT_NULL. Permanently deleted records cannot be restored.',
		idempotent: true,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		recordId: twentyAiProps.recordId({
			required: true,
			description:
				'UUID of the soft-deleted record, from List Records with the filter deletedAt[is]:NOT_NULL.',
		}),
	},
	async run(context) {
		const { objectNamePlural, recordId } = context.propsValue;
		return await twentyApi.restoreRecord({ auth: context.auth, objectNamePlural, recordId });
	},
});
