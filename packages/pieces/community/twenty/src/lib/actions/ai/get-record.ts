import { createAction } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyGetRecordOutputSchema } from '../../output-schemas';

export const getRecordAction = createAction({
	auth: twentyAuth,
	name: 'twenty_get_record',
	outputSchema: twentyGetRecordOutputSchema,
	displayName: 'Get Record',
	description: 'Gets one record of any object by its id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one record of an object by its UUID. Use when the id is already known (from List Records or a create); set Depth to 1 to also embed directly related records such as a person's company.",
		idempotent: true,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		recordId: twentyAiProps.recordId({ required: true }),
		depth: twentyAiProps.depth({ required: false }),
		fields: twentyAiProps.fields({ required: false }),
	},
	async run(context) {
		const { objectNamePlural, recordId, depth, fields } = context.propsValue;
		return await twentyApi.getRecord({
			auth: context.auth,
			objectNamePlural,
			recordId,
			depth,
			fields,
		});
	},
});
