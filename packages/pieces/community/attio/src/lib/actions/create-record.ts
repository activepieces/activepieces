import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { attioApiCall } from '../common/client';
import { formatInputFields, objectFields, objectTypeIdDropdown } from '../common/props';

export const createRecordAction = createAction({
	name: 'create_record',
	displayName: 'Create Record',
	description: 'Creates a new record such as peron,company or deal.',
	auth: attioAuth,
	props: {
		objectTypeId: objectTypeIdDropdown({
			displayName: 'Object',
			required: true,
		}),
		attributes: objectFields(),
	},
	async run(context) {
		const accessToken = context.auth;
		const objectTypeId = context.propsValue.objectTypeId;
		const inputFields = context.propsValue.attributes ?? {};

		if (!objectTypeId) {
			throw new Error('Provided object type is invalid.');
		}

		const formattedFields = await formatInputFields(accessToken,'objects', objectTypeId, inputFields);

		// https://docs.attio.com/rest-api/endpoint-reference/records/create-a-record
		const response = await attioApiCall<{data:Record<string,any>}>({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: `/objects/${objectTypeId}/records`,
			body: {
				data: {
					values: formattedFields,
				},
			},
		});

		return response.data;
	},
});
