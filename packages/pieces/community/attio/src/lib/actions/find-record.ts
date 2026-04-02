import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { formatInputFields, objectFields, objectTypeIdDropdown } from '../common/props';
import { attioApiCall, attioPaginatedApiCall } from '../common/client';

export const findRecordAction = createAction({
	name: 'find_record',
	displayName: 'Find Record',
	description: 'Search for records in Attio using filters and return matching results.',
	auth: attioAuth,
	props: {
		objectTypeId: objectTypeIdDropdown({
			displayName: 'Object',
			required: true,
		}),
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'Look up a record by its exact ID. When provided, all attribute filters are ignored.',
			required: false,
		}),
		attributes: objectFields(true),
	},
	async run(context) {
		const accessToken = context.auth.secret_text;
		const objectTypeId = context.propsValue.objectTypeId;
		const recordId = context.propsValue.recordId;

		if (!objectTypeId) {
			throw new Error('Provided object type is invalid.');
		}

		if (recordId) {
			const response = await attioApiCall<{ data: Record<string, unknown> }>({
				method: HttpMethod.GET,
				accessToken,
				resourceUri: `/objects/${objectTypeId}/records/${recordId}`,
			});
			return {
				found: true,
				result: [response.data],
			};
		}

		const inputFields = context.propsValue.attributes ?? {};
		const formattedFields = await formatInputFields(
			accessToken,
			'objects',
			objectTypeId,
			inputFields,
			true,
		);

		// https://docs.attio.com/rest-api/endpoint-reference/records/list-records
		const response = await attioPaginatedApiCall({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: `/objects/${objectTypeId}/records/query`,
			body: {
				filter: formattedFields,
			},
		});

		return {
			found: response.length > 0,
			result: response,
		};
	},
});
