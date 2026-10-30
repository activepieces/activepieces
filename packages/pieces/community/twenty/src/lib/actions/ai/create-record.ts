import { createAction, Property } from '@activepieces/pieces-framework';

import { twentyAuth } from '../../auth';
import { twentyAiProps } from '../../common/ai-props';
import { twentyApi } from '../../common/api';
import { twentyCreateRecordOutputSchema } from '../../output-schemas';

export const createRecordAction = createAction({
	auth: twentyAuth,
	name: 'twenty_create_record',
	outputSchema: twentyCreateRecordOutputSchema,
	displayName: 'Create Record',
	description: 'Creates one record of any object.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Creates one record (a person, company, opportunity, task, note or custom object record) from a JSON object of field values. Use Get Object first to learn the field names. Not idempotent: each call inserts a new record unless Upsert is on, in which case a record matching a unique field (such as a person's email or a company's domain) is updated instead.",
		idempotent: false,
	},
	props: {
		objectNamePlural: twentyAiProps.objectNamePlural({ required: true }),
		record: twentyAiProps.record({ required: true }),
		upsert: Property.Checkbox({
			displayName: 'Upsert',
			description:
				'Update the existing record instead of creating a duplicate when a unique field (e.g. email, domain) already matches. Defaults to false.',
			required: false,
		}),
	},
	async run(context) {
		const { objectNamePlural, record, upsert } = context.propsValue;
		return await twentyApi.createRecord({ auth: context.auth, objectNamePlural, record, upsert });
	},
});
