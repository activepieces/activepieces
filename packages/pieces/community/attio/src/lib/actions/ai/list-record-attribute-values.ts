import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListRecordAttributeValuesOutputSchema } from '../../output-schemas';

export const attioListRecordAttributeValuesAction = createAction({
	auth: attioAuth,
	name: 'attio_list_record_attribute_values',
	outputSchema: attioListRecordAttributeValuesOutputSchema,
	displayName: 'List Record Attribute Values',
	description: 'Lists current or historic values of one attribute on a record.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the values of one attribute on a record, optionally including historic values to see how it changed over time. Historic values are not available for some attribute types (e.g. COMINT or enriched attributes).',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp(),
		attribute: attioAi.attributeProp(),
		show_historic: Property.Checkbox({
			displayName: 'Show Historic',
			description: 'Include values that are no longer active.',
			required: false,
		}),
		limit: attioAi.limitProp({ max: 500 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { object, record_id, attribute, show_historic, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/objects/${object}/records/${record_id}/attributes/${attribute}/values`,
			query: { show_historic: show_historic ? 'true' : undefined, limit, offset },
		});
		return { values: response.data, count: response.data.length };
	},
});
