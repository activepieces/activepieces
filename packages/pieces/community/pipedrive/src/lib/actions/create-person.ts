import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { personCommonProps } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, PersonCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'create-person',
	displayName: 'Create Person',
	description: 'Creates a new person.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		...personCommonProps,
	},
	async run(context) {
		const { name, ownerId, organizationId, marketing_status, visibleTo, firstName, lastName } =
			context.propsValue;
		const phone = (context.propsValue.phone as string[]) ?? [];
		const email = (context.propsValue.email as string[]) ?? [];
		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const personDefaultFields: Record<string, any> = {
			name: name,
			owner_id: ownerId,
			org_id: organizationId,
			marketing_status: marketing_status,
			visible_to: visibleTo,
			first_name: firstName,
			last_name: lastName,
		};

		if (phone.length > 0) {
			personDefaultFields.phone = phone;
		}

		if (email.length > 0) {
			personDefaultFields.email = email;
		}

		if (labelIds.length > 0) {
			personDefaultFields.label_ids = labelIds;
		}

		const personCustomFields: Record<string, string> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			personCustomFields[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdPersonResponse = await pipedriveApiCall<PersonCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/persons',
			body: {
				...personDefaultFields,
				...personCustomFields,
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
			createdPersonResponse.data,
		);

		return {
			...createdPersonResponse,
			data: updatedPersonProperties,
		};
	},
});
