import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { personCommonProps } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedriveParseCustomFields,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetPersonResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

export const createPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'create-person',
	displayName: 'Create Person',
	description: 'Creates a new person.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: false,
		}),
		...personCommonProps,
	},
	async run(context) {
		const { name, ownerId, organizationId, marketing_status, visibleTo, firstName, lastName } =
			context.propsValue;

		const rawPhones = (context.propsValue.phone as string[]) ?? [];
		const rawEmails = (context.propsValue.email as string[]) ?? [];
		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		// https://pipedrive.readme.io/docs/pipedrive-api-v2-migration-guide#post-apiv1persons-to-post-apiv2persons
		if (name && (firstName || lastName)) {
			throw new Error('Provide either Name OR First Name/Last Name, not both.');
		}

		if (!name && !firstName && !lastName) {
			throw new Error('Provide Name or at least one of First Name / Last Name.');
		}

		if (!name && ((firstName && !lastName) || (!firstName && lastName))) {
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
			name,
			owner_id: ownerId,
			org_id: organizationId,
			visible_to: visibleTo,
			first_name: firstName,
			last_name: lastName,
			marketing_status: marketing_status,
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

		const createdPersonResponse = await pipedriveApiCall<GetPersonResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/v2/persons',
			body: personPayload,
		});

		const transformedPersonProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			createdPersonResponse.data,
		);

		return {
			...createdPersonResponse,
			data: transformedPersonProperties,
		};
	},
});
