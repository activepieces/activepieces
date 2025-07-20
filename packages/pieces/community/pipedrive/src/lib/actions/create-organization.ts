import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { organizationCommonProps } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const createOrganizationAction = createAction({
	auth: pipedriveAuth,
	name: 'create-organization',
	displayName: 'Create Organization',
	description: 'Creates a new organization.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		...organizationCommonProps,
	},
	async run(context) {
		const { name, ownerId, address, visibleTo } = context.propsValue;

		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const organizationDefaultFields: Record<string, any> = {
			name: name,
			owner_id: ownerId,
			visible_to: visibleTo,
			address: address,
		};

		if (labelIds.length > 0) {
			organizationDefaultFields.label_ids = labelIds;
		}

		const organizationCustomFields: Record<string, string> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			organizationCustomFields[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdOrganizationResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/organizations',
			body: {
				...organizationDefaultFields,
				...organizationCustomFields,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizationFields',
		});

		const updatedOrganizationProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			createdOrganizationResponse.data,
		);

		return {
			...createdOrganizationResponse,
			data: updatedOrganizationProperties,
		};
	},
});
