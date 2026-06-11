import { pipedriveAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { leadCommonProps } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedV1ApiCall,
    pipedriveTransformCustomFields,
    pipedriveTransformV1CustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, GetLeadResponse } from '../common/types';
import dayjs from 'dayjs';

export const createLeadAction = createAction({
    auth: pipedriveAuth,
    name: 'create-lead',
    displayName: 'Create Lead',
    description: 'Creates a new lead.',
    audience: 'both',
    aiMetadata: {
        description:
            'Creates a new lead with a required title and optional value, owner, channel, and custom fields. At least one of a linked person or organization must be supplied. Use to capture an unqualified opportunity (use Create Deal once it advances to your pipeline, or Update Lead to edit one). Not idempotent: each call creates a separate lead.',
        idempotent: false,
    },
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
            leadValue,
            leadValueCurrency,
            expectedCloseDate,
            visibleTo,
            ownerId,
            organizationId,
            personId,
            channel,
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

        
        const createdLeadResponse = await pipedriveApiCall<GetLeadResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v1/leads', 
           body: {
				...leadDefaultFields,
				...leadCustomFields,
			},
        });

        const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/dealFields',
        });

        const updatedLeadProperties = pipedriveTransformV1CustomFields(
            customFieldsResponse,
            createdLeadResponse.data,
        );

        return {
            ...createdLeadResponse,
            data: updatedLeadProperties,
        };
    },
});
