import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealCommonProps } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import dayjs from 'dayjs';

export const createDealAction = createAction({
	auth: pipedriveAuth,
	name: 'create-deal',
	displayName: 'Create Deal',
	description: 'Creates a new deal.',
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
		...dealCommonProps,
	},
	async run(context) {
		const {
			title,
			dealValue,
			dealValueCurrency,
			expectedCloseDate,
			visibleTo,
			probability,
			stageId,
			status,
			pipelineId,
			ownerId,
			organizationId,
			personId,
			creationTime,
		} = context.propsValue;

		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const dealDefaultFields: Record<string, any> = {
			title,
			pipeline_id: pipelineId,
			stage_id: stageId,
			status,
			add_time: creationTime,
			probability,
			visible_to: visibleTo,
			user_id: ownerId,
			org_id: organizationId,
			person_id: personId,
			value: dealValue,
			currency: dealValueCurrency,
		};

		if (labelIds.length > 0) {
			dealDefaultFields.label = labelIds;
		}

		if (expectedCloseDate) {
			dealDefaultFields.expected_close_date = dayjs(expectedCloseDate).format('YYYY-MM-DD');
		}

		const dealCustomFields: Record<string, any> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			dealCustomFields[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdDealResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/deals',
			body: {
				...dealDefaultFields,
				...dealCustomFields,
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
			createdDealResponse.data,
		);

		return {
			...createdDealResponse,
			data: updatedLeadProperties,
		};
	},
});
