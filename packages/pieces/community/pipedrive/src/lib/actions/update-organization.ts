import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { organizationCommonProps, organizationIdProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateOrganizationAction = createAction({
	auth: pipedriveAuth,
	name: 'update-organization',
	displayName: 'Update Organization',
	description: 'Updates an existing organization.',
	props: {
		organizationId: organizationIdProp(true),
		name: Property.ShortText({
			displayName: 'Name',
			required: false,
		}),
		...organizationCommonProps,
	},
	async run(context) {
		const { name, ownerId, address, visibleTo, organizationId } = context.propsValue;

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
			organizationCustomFields[key] =
				Array.isArray(value) && value.length > 0 ? value.join(',') : value;
		});

		const updatedOrganizationResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PUT,
			resourceUri: `/organizations/${organizationId}`,
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
			updatedOrganizationResponse.data,
		);

		return {
			...updatedOrganizationResponse,
			data: updatedOrganizationProperties,
		};
	},
});
