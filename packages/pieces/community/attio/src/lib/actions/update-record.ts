import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { attioApiCall } from '../common/client';
import { formatInputFields, objectFields, objectTypeIdDropdown } from '../common/props';

export const updateRecordAction = createAction({
	name: 'update_record',
	displayName: 'Update Record',
	description: 'Update an existing record with new attribute values.',
	auth: attioAuth,
	props: {
		objectTypeId: objectTypeIdDropdown({
			displayName: 'Object',
			required: true,
		}),
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The unique identifier of the record to update.',
			required: true,
		}),

		attributes: objectFields(true),
	},
	async run(context) {
		const accessToken = context.auth;
		const recordId = context.propsValue.recordId;
		const objectTypeId = context.propsValue.objectTypeId;
		const inputFields = context.propsValue.attributes ?? {};

		if (!objectTypeId) {
			throw new Error('Provided object type is invalid.');
		}
		const formattedFields = await formatInputFields(accessToken,'objects', objectTypeId, inputFields);

		// https://docs.attio.com/rest-api/endpoint-reference/records/update-a-record-append-multiselect-values
		const response = await attioApiCall<{data:Record<string,any>}>({
			method: HttpMethod.PATCH,
			accessToken,
			resourceUri: `/objects/${objectTypeId}/records/${recordId}`,
			body: {
				data: {
					values: formattedFields,
				},
			},
		});

		return response.data;
	},
});
