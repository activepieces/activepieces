import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { leadCommonProps } from '../common/props';
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
    },
    async run(context) {
        const {
            title,
            leadValue, // This comes as Property.Number from props.ts, so it should be a number
            leadValueCurrency,
            expectedCloseDate,
            visibleTo,
            ownerId,
            organizationId,
            personId,
            channel, // This comes as Property.Dropdown from props.ts, value should be a number
        } = context.propsValue;

        const labelIds = (context.propsValue.labelIds as string[]) ?? [];

        // Define standard properties that should NOT be treated as generic custom fields.
        // We exclude these as they are explicitly mapped below or handled as custom fields.
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
            // If you have a custom field named 'channel' in your customfields object,
            // ensure its key is different from the root 'channel' field to avoid conflict.
        ]);

        const customFields: Record<string, unknown> = {};
        const allProps = context.propsValue as Record<string, any>;

        // Collect all properties that are not standard, assuming they are custom fields.
        for (const key in allProps) {
            if (Object.prototype.hasOwnProperty.call(allProps, key) && !standardPropKeys.has(key)) {
                customFields[key] = allProps[key];
            }
        }

        // --- Handle Custom Monetary Field for Lead Value and Currency ---
        // This is where 'leadValue' and 'leadValueCurrency' should be used IF they are
        // intended for a custom monetary field.
        // YOU MUST REPLACE 'd4de1c1518b4531717c676029a45911c340390a6' with your actual Pipedrive custom field key.
        if (leadValue !== undefined && leadValueCurrency) {
            // Assume this is the key for your custom monetary field for leads.
            const monetaryCustomFieldKey = 'd4de1c1518b4531717c676029a45911c340390a6'; // <-- IMPORTANT: Replace with your actual custom field key (the hash)
            customFields[monetaryCustomFieldKey] = {
                value: leadValue, // This 'value' is for the custom field's nested object
                currency: leadValueCurrency,
            };
        }

        // Prepare the lead payload for the Pipedrive API.
        const leadPayload: Record<string, any> = {
            title,
            owner_id: ownerId,
            organization_id: organizationId,
            person_id: personId,
            visible_to: visibleTo,
            // Format expected close date to YYYY-MM-DD if provided.
            expected_close_date: expectedCloseDate ? dayjs(expectedCloseDate).format('YYYY-MM-DD') : undefined,
            
            // --- FIX FOR 'channel' FIELD ---
            // The error explicitly states "channel" must be a number.
            // We ensure 'channel' from props is a number, handling cases where it might be wrapped in an array.
            channel: Array.isArray(channel) ? channel[0] : channel, // Direct 'channel' field, ensures it's a number
            
            // --- FIX FOR 'value' FIELD ---
            // The Lead object in Pipedrive API v2 has a 'value' field which is a simple number.
            // If 'leadValue' from props is meant for this, ensure it's directly assigned here.
            // If leadValueCurrency is provided, it implies a CUSTOM MONETARY FIELD, which is handled above.
            // To avoid sending both a root 'value' and a custom monetary field using the same input names,
            // we will only set the root 'value' if 'leadValueCurrency' is NOT present,
            // assuming 'leadValue' alone means the simple numeric lead value.
            value: (leadValue !== undefined && !leadValueCurrency) ? leadValue : undefined,
            // The `value` for the root lead object is a simple number.
            // If `leadValueCurrency` is present, we assume `leadValue` is for the custom monetary field.
            // If `leadValueCurrency` is NOT present, `leadValue` populates the root `value` field.
        };

        // Add label_ids if present
        if (labelIds.length > 0) {
            leadPayload.label_ids = labelIds;
        }

        

        // Make the API call to create the lead
        const createdLeadResponse = await pipedriveApiCall<GetLeadResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v1/leads', 
            body: leadPayload,
        });

        // Fetch lead custom field definitions to transform the response
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/leadSources',
        });

        // Transform the custom fields in the API response for client-side use/readability
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
