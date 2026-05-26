import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { objectTypeIdDropdown } from '../common/props';
import { attioApiCall, buildMembersMap, normalizeRecord } from '../common/client';
import { AttioRecordResponse } from '../common/types';

export const getRecordAction = createAction({
	name: 'get_record',
	displayName: 'Get Record',
	description: 'Retrieve a single record by ID and return its normalized attribute values.',
	auth: attioAuth,
	props: {
		objectTypeId: objectTypeIdDropdown({
			displayName: 'Object',
			required: true,
		}),
		recordId: Property.ShortText({
			displayName: 'Record ID',
			required: true,
		}),
	},
	async run(context) {
		const accessToken = context.auth.secret_text;
		const { objectTypeId, recordId } = context.propsValue;

		if (!objectTypeId) {
			throw new Error('Provided object type is invalid.');
		}

		const response = await attioApiCall<{ data: AttioRecordResponse }>({
			method: HttpMethod.GET,
			accessToken,
			resourceUri: `/objects/${objectTypeId}/records/${recordId}`,
		});

		const records = [response.data];
		const membersMap = await buildMembersMap(accessToken, records);
		return normalizeRecord(response.data, membersMap);
	},
});
