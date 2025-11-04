import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealCommonProps, dealIdProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedriveParseCustomFields,
	pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, GetDealResponse } from '../common/types';
import dayjs from 'dayjs';
import { isEmpty } from '@activepieces/shared';

export const updateDealAction = createAction({
	auth: pipedriveAuth,
	name: 'update-deal',
	displayName: 'Update Deal',
	description: 'Updates an existing deal.',
	props: {
		dealId: dealIdProp(true),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		...dealCommonProps,
	},
	async run(context) {
		const {
			dealId,
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
		} = context.propsValue;

		const labelIds = (context.propsValue.labelIds as number[]) ?? [];
		const customFields = context.propsValue.customfields ?? {};

		const dealPayload: Record<string, any> = {
			title,
			pipeline_id: pipelineId,
			stage_id: stageId,
			status,
			probability,
			visible_to: visibleTo,
			owner_id: ownerId,
			org_id: organizationId,
			person_id: personId,
			value: dealValue,
			currency: dealValueCurrency,
		};

		if (labelIds.length > 0) {
			dealPayload.label_ids = labelIds;
		}

		if (expectedCloseDate) {
			dealPayload.expected_close_date = dayjs(expectedCloseDate).format('YYYY-MM-DD');
		}

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/dealFields',
		});

		const personCustomFields = pipedriveParseCustomFields(customFieldsResponse, customFields);

		if (!isEmpty(personCustomFields)) {
			dealPayload.custom_fields = personCustomFields;
		}

		const updatedDealResponse = await pipedriveApiCall<GetDealResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PATCH,
			resourceUri: `/v2/deals/${dealId}`,
			body: dealPayload,
		});

		const transformedDealProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			updatedDealResponse.data,
		);

		return {
			...updatedDealResponse,
			data: transformedDealProperties,
		};
	},
});
