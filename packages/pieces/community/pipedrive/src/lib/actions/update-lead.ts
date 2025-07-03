import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { leadCommonProps, leadIdProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

export const updateLeadAction = createAction({
	auth: pipedriveAuth,
	name: 'update-lead',
	displayName: 'Update Lead',
	description: 'Updates an existing lead.',
	props: {
		leadId: leadIdProp(true),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		...leadCommonProps,
	},
	async run(context) {
		const {
			title,
			ownerId,
			leadId,
			channel,
			organizationId,
			personId,
			expectedCloseDate,
			visibleTo,
			leadValue,
			leadValueCurrency,
		} = context.propsValue;

		const labelIds = (context.propsValue.labelIds as string[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const leadDefaultFields: Record<string, any> = {
			title,
			owner_id: ownerId,
			organization_id: organizationId,
			person_id: personId,
			channel: channel,
			visible_to: visibleTo,
		};

		if (labelIds.length > 0) {
			leadDefaultFields.label_ids = labelIds;
		}

		if (expectedCloseDate) {
			leadDefaultFields.expected_close_date = dayjs(expectedCloseDate).format('YYYY-MM-DD');
		}

		if (leadValue) {
			if (!leadValueCurrency) {
				throw new Error('lead Value Currency is required when lead Value is provided');
			}
			leadDefaultFields.value = {
				amount: leadValue,
				currency: leadValueCurrency,
			};
		}

		const leadCustomFields: Record<string, any> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			leadCustomFields[key] = Array.isArray(value) && value.length > 0 ? value.join(',') : value;
		});

		const updatedLeadResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PATCH,
			resourceUri: `/leads/${leadId}`,
			body: {
				...leadDefaultFields,
				...leadCustomFields,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		const updatedLeadProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			updatedLeadResponse.data,
		);

		return {
			...updatedLeadResponse,
			data: updatedLeadProperties,
		};
	},
});
