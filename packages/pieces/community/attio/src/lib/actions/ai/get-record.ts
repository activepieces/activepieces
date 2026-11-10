import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { AttioRecordResponse } from '../../common/types';
import { attioCreateRecordOutputSchema } from '../../output-schemas';

export const attioGetRecordAction = createAction({
	auth: attioAuth,
	name: 'attio_get_record',
	outputSchema: attioCreateRecordOutputSchema,
	displayName: 'Get Record',
	description: 'Gets a record by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one record by object and record ID, with its attribute values flattened. Use Query Records or Search Records to find the ID first.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp(),
	},
	async run(context) {
		const { object, record_id } = context.propsValue;
		const response = await attioApiCall<{ data: AttioRecordResponse }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/objects/${object}/records/${record_id}`,
		});
		return attioAi.flattenRecord(response.data);
	},
});
