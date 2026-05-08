import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { formatInputFields, objectFields, objectTypeIdDropdown } from '../common/props';
import { attioApiCall, attioPaginatedApiCall, buildMembersMap, normalizeRecord } from '../common/client';
import { AttioRecordResponse } from '../common/types';

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
			const response = await attioApiCall<{ data: AttioRecordResponse }>({
				method: HttpMethod.GET,
				accessToken,
				resourceUri: `/objects/${objectTypeId}/records/${recordId}`,
			});
			const records = [response.data];
			const membersMap = await buildMembersMap(accessToken, records);
			return {
				found: true,
				result: records.map((r) => normalizeRecord(r, membersMap)),
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
		const records = await attioPaginatedApiCall<AttioRecordResponse>({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: `/objects/${objectTypeId}/records/query`,
			body: {
				filter: formattedFields,
			},
		});

		const membersMap = await buildMembersMap(accessToken, records);
		return {
			found: records.length > 0,
			result: records.map((r) => normalizeRecord(r, membersMap)),
		};
	},
});
