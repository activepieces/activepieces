import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { leadCommonProps, customFieldsProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, GetLeadResponse } from '../common/types';
import dayjs from 'dayjs';

export const createLeadAction = createAction({
    auth: pipedriveAuth,
    name: 'create-lead',
    displayName: 'Create Lead',
    description: 'Creates a new lead using Pipedrive API v2.',
    props: {
        title: Property.ShortText({
            displayName: 'Title',
            required: true,
        }),
        ...leadCommonProps, // Spreads all the common lead properties
        customfields: customFieldsProp('lead'), // Added dynamic custom fields for leads
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
        } = context.propsValue;

        const labelIds = (context.propsValue.labelIds as string[]) ?? [];

        
        const standardPropKeys = new Set([
            'title',
            'leadValue',
            'leadValueCurrency',
            'expectedCloseDate',
            'visibleTo',
            'ownerId',
            'organizationId',
            'personId',
            'labelIds', 
            'channel', 
            'channelId', 
        ]);

        const customFields: Record<string, unknown> = {};
        const allProps = context.propsValue as Record<string, any>;
        for (const key in allProps) {
            if (Object.prototype.hasOwnProperty.call(allProps, key) && !standardPropKeys.has(key)) {
                customFields[key] = allProps[key];
            }
        }

        const leadPayload: Record<string, any> = {
            title,
            owner_id: ownerId,
            org_id: organizationId,
            person_id: personId,
            visible_to: visibleTo,
            value: (leadValue !== undefined && leadValueCurrency) ? {
                amount: leadValue,
                currency: leadValueCurrency,
            } : undefined,
        };

        if (labelIds.length > 0) {
            leadPayload.label_ids = labelIds;
        }

        if (expectedCloseDate) {
            leadPayload.expected_close_date = dayjs(expectedCloseDate).format('YYYY-MM-DD');
        }

        // Assign the collected custom fields to the 'custom_fields' object in the payload
        if (Object.keys(customFields).length > 0) {
            leadPayload.custom_fields = customFields;
        }

        const createdLeadResponse = await pipedriveApiCall<GetLeadResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/leads',
            body: leadPayload,
        });

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/leadFields',
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
