import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealCommonProps } from '../common/props';
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

		const dealPayload: Record<string, any> = {
			title,
			pipeline_id: pipelineId,
			stage_id: stageId,
			status,
			add_time: creationTime ? dayjs(creationTime).format('YYYY-MM-DDTHH:mm:ss[Z]') : undefined,
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

		const dealCustomFields = pipedriveParseCustomFields(customFieldsResponse, customFields);

		if (!isEmpty(dealCustomFields)) {
			dealPayload.custom_fields = dealCustomFields;
		}

		const createdDealResponse = await pipedriveApiCall<GetDealResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/v2/deals',
			body: dealPayload,
		});

		const transformedPersonProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			createdDealResponse.data,
		);

		return {
			...createdDealResponse,
			data: transformedPersonProperties,
		};
	},
});
