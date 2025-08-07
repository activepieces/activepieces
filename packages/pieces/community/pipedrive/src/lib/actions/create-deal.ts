import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealCommonProps, customFieldsProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, GetDealResponse } from '../common/types';
import dayjs from 'dayjs';

export const createDealAction = createAction({
    auth: pipedriveAuth,
    name: 'create-deal',
    displayName: 'Create Deal',
    description: 'Creates a new deal using Pipedrive API v2.',
    props: {
        title: Property.ShortText({
            displayName: 'Title',
            required: true,
        }),
        ...dealCommonProps, // Spreads all the common deal properties
        customfields: customFieldsProp('deal'), // This defines the dynamic custom fields
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
            // Removed 'customfields' from destructuring here, as it won't exist directly
        } = context.propsValue;

        // label_ids replaces the 'label' field in v1 and expects an array of numbers.
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

        // Define standard properties that are NOT custom fields
        const standardPropKeys = new Set([
            'title',
            'dealValue',
            'dealValueCurrency',
            'expectedCloseDate',
            'visibleTo',
            'probability',
            'stageId',
            'status',
            'pipelineId',
            'ownerId',
            'organizationId',
            'personId',
            'creationTime',
            'labelIds', // Add labelIds here as it's a standard prop
        ]);

        // Collect custom fields by filtering out standard properties from context.propsValue
        const customFields: Record<string, unknown> = {};
        // ✅ Cast context.propsValue to a more general type to allow string indexing
        const allProps = context.propsValue as Record<string, any>;
        for (const key in allProps) {
            if (Object.prototype.hasOwnProperty.call(allProps, key) && !standardPropKeys.has(key)) {
                customFields[key] = allProps[key];
            }
        }

        const dealPayload: Record<string, any> = {
            title,
            pipeline_id: pipelineId,
            stage_id: stageId,
            status,
            add_time: creationTime ? dayjs(creationTime).toISOString() : undefined,
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

        // Assign the collected custom fields to the 'custom_fields' object in the payload
        if (Object.keys(customFields).length > 0) {
            dealPayload.custom_fields = customFields;
        }

        const createdDealResponse = await pipedriveApiCall<GetDealResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/deals',
            body: dealPayload,
        });

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields',
        });

        const updatedDealProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            createdDealResponse.data,
        );

        return {
            ...createdDealResponse,
            data: updatedDealProperties,
        };
    },
});
