import { pipedriveAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { labelIdsProp, personIdProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, PersonCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const addLabelToPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'add-labels-to-person',
	displayName: 'Add Labels to Person',
	description: 'Adds an existing labels to an existing person.',
	props: {
		personId: personIdProp(true),
		labelIds: labelIdsProp('person', 'label_ids', true),
	},
	async run(context) {
		const { personId } = context.propsValue;
		const labelIds = (context.propsValue.labelIds as number[]) ?? [];

		const personDefaultFields: Record<string, any> = {};

		if (labelIds.length > 0) {
			personDefaultFields.label_ids = labelIds;
		}

		const updatedPersonResponse = await pipedriveApiCall<PersonCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PUT,
			resourceUri: `/persons/${personId}`,
			body: {
				...personDefaultFields,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/personFields',
		});

		const updatedPersonProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			updatedPersonResponse.data,
		);

		return {
			...updatedPersonResponse,
			data: updatedPersonProperties,
		};
	},
});
