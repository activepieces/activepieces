import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { personCommonProps, personIdProp, customFieldsProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedriveParseCustomFields,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetPersonResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

export const updatePersonAction = createAction({
	auth: pipedriveAuth,
	name: 'update-person',
	displayName: 'Update Person',
	description: 'Updates an existing person.',
	props: {
		personId: personIdProp(true),
		name: Property.ShortText({
			displayName: 'Name',
			required: false,
		}),
		...personCommonProps,
	},
	async run(context) {
		const {
			name,
			ownerId,
			personId,
			organizationId,
			marketing_status,
			visibleTo,
			firstName,
			lastName,
		} = context.propsValue;

		const rawPhones = (context.propsValue.phone as string[]) ?? [];
		const rawEmails = (context.propsValue.email as string[]) ?? [];
		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};


        
		if ((firstName && !lastName) || (!firstName && lastName)) {
			throw new Error('If First Name is provided, Last Name must be provided as well.');
		}

		const phones = rawPhones.map((value, index) => ({
			value,
			label: 'work',
			primary: index === 0,
		}));

		const emails = rawEmails.map((value, index) => ({
			value,
			label: 'work',
			primary: index === 0,
		}));

		const personPayload: Record<string, any> = {
			name: name,
			owner_id: ownerId,
			org_id: organizationId,
			marketing_status: marketing_status,
			visible_to: visibleTo,
			first_name: firstName,
			last_name: lastName,
		};

		// Phones and emails
		if (phones.length) personPayload.phones = phones;
		if (emails.length) personPayload.emails = emails;
		if (labelIds.length) personPayload.label_ids = labelIds;

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/personFields',
		});

		const personCustomFields = pipedriveParseCustomFields(customFieldsResponse, customFields);

		if (!isEmpty(personCustomFields)) {
			personPayload.custom_fields = personCustomFields;
		}

		const updatedPersonResponse = await pipedriveApiCall<GetPersonResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PATCH,
			resourceUri: `/v2/persons/${personId}`,
			body: personPayload,
		});

		const transformedPersonProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			updatedPersonResponse.data,
		);

		return {
			...updatedPersonResponse,
			data: transformedPersonProperties,
		};
	},
});
