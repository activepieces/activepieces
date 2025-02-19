import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { leadCommonProps } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

export const createLeadAction = createAction({
	auth: pipedriveAuth,
	name: 'create-lead',
	displayName: 'Create Lead',
	description: 'Creates a new lead.',
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
		...leadCommonProps,
	},
	async run(context) {
		const {
			title,
			ownerId,
			channel,
			organizationId,
			personId,
			expectedCloseDate,
			visibleTo,
			leadValue,
			leadValueCurrency,
		} = context.propsValue;

		if (!personId && !organizationId) {
			throw new Error(
				'Neither an Organization nor a Person were provided. One of them must be provided in order to create a lead.',
			);
		}

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

		if(expectedCloseDate)
		{
			leadDefaultFields.expected_close_date= dayjs(expectedCloseDate).format('YYYY-MM-DD')

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
			leadCustomFields[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdLeadResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/leads',
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
			createdLeadResponse.data,
		);

		return {
			...createdLeadResponse,
			data: updatedLeadProperties,
		};
	},
});
