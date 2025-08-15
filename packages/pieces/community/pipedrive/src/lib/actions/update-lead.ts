import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { leadCommonProps, leadIdProp, customFieldsProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField, GetLeadResponse } from '../common/types'; 
import dayjs from 'dayjs';

export const updateLeadAction = createAction({
    auth: pipedriveAuth,
    name: 'update-lead',
    displayName: 'Update Lead',
    description: 'Updates an existing lead using Pipedrive API v2.',
    props: {
        leadId: leadIdProp(true), // This prop should return the Lead ID (UUID string in v2)
        title: Property.ShortText({
            displayName: 'Title',
            required: false,
        }),
        ...leadCommonProps, // Spreads common lead properties 
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
            // Removed 'customfields' from destructuring here, as it won't exist directly
        } = context.propsValue;

       
        const labelIds = (context.propsValue.labelIds as string[]) ?? [];

        // Define standard properties that are NOT custom fields for leads
        const standardPropKeys = new Set([
            'leadId',
            'title',
            'ownerId',
            'channel',
            'organizationId',
            'personId',
            'expectedCloseDate',
            'visibleTo',
            'leadValue',
            'leadValueCurrency',
            'labelIds', // Add labelIds here as it's a standard prop
        ]);

      
        const customFields: Record<string, unknown> = {};
        
        

        const leadPayload: Record<string, any> = {
            title,
            owner_id: ownerId,
            organization_id: organizationId,
            person_id: personId,
            channel: channel,
            visible_to: visibleTo,
        };

        if (labelIds.length > 0) {
            leadPayload.label_ids = labelIds; 
        }

        if (expectedCloseDate) {
            leadPayload.expected_close_date = dayjs(expectedCloseDate).format('YYYY-MM-DD');
        }

        if (leadValue !== undefined) {
            if (!leadValueCurrency) {
                throw new Error('Lead Value Currency is required when Lead Value Amount is provided');
            }
            leadPayload.value = {
                amount: leadValue,
                currency: leadValueCurrency,
            };
        }

        // Assign the collected custom fields to the 'custom_fields' object in the payload
        if (Object.keys(customFields).length > 0) {
            leadPayload.custom_fields = customFields;
        }

        
        if (!context.propsValue.leadId){
            throw new Error('Lead ID is required to update a lead');
        }
       
        const updatedLeadResponse = await pipedriveApiCall<GetLeadResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH,
            resourceUri: `/v1/leads/${context.propsValue.leadId}`,
            body: leadPayload,
        });

        
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/dealFields',
        });

        // This function transforms the custom fields in the *response* data
        const transformedLeadProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            updatedLeadResponse.data,
        );

        return {
            ...updatedLeadResponse,
            data: transformedLeadProperties,
        };
    },
});
