import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { formatInputFields, objectFields, objectTypeIdDropdown } from '../common/props';
import { attioPaginatedApiCall } from '../common/client';

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
		attributes: objectFields(true),
	},
	async run(context) {
		const accessToken = context.auth;
		const objectTypeId = context.propsValue.objectTypeId;
		const inputFields = context.propsValue.attributes ?? {};

		if (!objectTypeId) {
			throw new Error('Provided object type is invalid.');
		}
		const formattedFields = await formatInputFields(
			accessToken,
			'objects',
			objectTypeId,
			inputFields,
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
