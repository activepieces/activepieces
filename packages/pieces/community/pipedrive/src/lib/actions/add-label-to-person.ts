import { pipedriveAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { labelIdsProp, personIdProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetPersonResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const addLabelToPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'add-labels-to-person',
	displayName: 'Add Labels to Person',
	description: 'Adds existing labels to an existing person.',
	props: {
		personId: personIdProp(true),
		labelIds: labelIdsProp('person', 'label_ids', true),
	},
	async run(context) {
		const { personId } = context.propsValue;
		const labelIds = (context.propsValue.labelIds as number[]) ?? [];

		const personUpdatePayload: Record<string, any> = {};

		if (labelIds.length > 0) {
			personUpdatePayload.label_ids = labelIds;
		}

		const updatedPersonResponse = await pipedriveApiCall<GetPersonResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PATCH,
			resourceUri: `/v2/persons/${personId}`,
			body: {
				...personUpdatePayload,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/personFields',
		});

		const transformedPersonData = pipedriveTransformCustomFields(
			customFieldsResponse,
			updatedPersonResponse.data,
		);

		return {
			...updatedPersonResponse,
			data: transformedPersonData,
		};
	},
});
