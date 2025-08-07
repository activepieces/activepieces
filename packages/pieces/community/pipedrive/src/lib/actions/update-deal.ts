import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealCommonProps, dealIdProp, customFieldsProp } from '../common/props'; // ✅ Import customFieldsProp
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, GetDealResponse } from '../common/types'; // ✅ Changed to GetDealResponse
import dayjs from 'dayjs';

export const updateDealAction = createAction({
    auth: pipedriveAuth,
    name: 'update-deal',
    displayName: 'Update Deal',
    description: 'Updates an existing deal using Pipedrive API v2.',
    props: {
        dealId: dealIdProp(true),
        title: Property.ShortText({
            displayName: 'Title',
            required: false,
        }),
        ...dealCommonProps, // Spreads common deal properties
        customfields: customFieldsProp('deal'), // ✅ Add dynamic custom fields for deals
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
            // Removed 'creationTime' from destructuring as it's not typically updated for existing deals
        } = context.propsValue;

        // `label_ids` replaces the `label` field in v1 and expects an array of numbers.
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

        // Define standard properties that are NOT custom fields for deals
        const standardPropKeys = new Set([
            'dealId', // Add dealId to standard keys
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
            'labelIds', // Add labelIds to standard keys
            // Removed 'creationTime' from standardPropKeys
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
            // 'add_time' is for creation, not typically updated on existing deals.
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

        // ✅ Use PATCH method for updates and specify v2 endpoint, expecting GetDealResponse
        const updatedDealResponse = await pipedriveApiCall<GetDealResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH,
            resourceUri: `/v2/deals/${dealId}`,
            body: dealPayload,
        });

        // ✅ Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields',
        });

        // This function transforms the custom fields in the *response* data
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
