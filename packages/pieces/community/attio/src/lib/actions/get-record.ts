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
	audience: 'both',
	aiMetadata: { description: 'Fetches one record by its exact ID within a given Attio object type and returns its normalized attribute values. Choose this when you already have the record ID and want its current data; use Find Record instead when you need to search by attributes. Read-only and idempotent.', idempotent: true },
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
