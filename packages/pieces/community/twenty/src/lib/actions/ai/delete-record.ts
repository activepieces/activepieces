import { createAction, Property } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyDeleteRecordOutputSchema } from '../../output-schemas';

export const deleteRecordAction = createAction({
	auth: twentyAuth,
	name: 'twenty_delete_record',
	outputSchema: twentyDeleteRecordOutputSchema,
	displayName: 'Delete Record',
	description: 'Deletes one record of any object, softly by default.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes one record by its UUID. By default it is a soft delete: the record moves to the trash and Restore Record brings it back. Turn on Permanent only when the user explicitly wants it gone for good; that cannot be undone and needs the destroy permission.',
		idempotent: false,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		recordId: twentyAiProps.recordId({ required: true }),
		permanent: Property.Checkbox({
			displayName: 'Permanent',
			description:
				'Permanently destroy the record instead of moving it to the trash. Cannot be undone. Defaults to false.',
			required: false,
		}),
	},
	async run(context) {
		const { objectNamePlural, recordId, permanent } = context.propsValue;
		return await twentyApi.deleteRecord({
			auth: context.auth,
			objectNamePlural,
			recordId,
			permanent,
		});
	},
});
