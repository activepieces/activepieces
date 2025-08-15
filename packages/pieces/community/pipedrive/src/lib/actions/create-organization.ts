import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { organizationCommonProps, customFieldsProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetOrganizationResponse } from '../common/types'; 
import { HttpMethod } from '@activepieces/pieces-common';

export const createOrganizationAction = createAction({
    auth: pipedriveAuth,
    name: 'create-organization',
    displayName: 'Create Organization',
    description: 'Creates a new organization using Pipedrive API v2.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: true,
        }),
        ...organizationCommonProps, 
        customfields: customFieldsProp('organization'), 
    },
    async run(context) {
        const { name, ownerId, address, visibleTo } = context.propsValue;

        
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

        
        const standardPropKeys = new Set([
            'name',
            'ownerId',
            'address',
            'visibleTo',
            'labelIds', 
        ]);

        
        const customFields: Record<string, unknown> = {};
        
        const allProps = context.propsValue as Record<string, any>;
        for (const key in allProps) {
            if (key==='auth' || key ==='customfields'){
                continue; 
            }
            if (Object.prototype.hasOwnProperty.call(allProps, key) && !standardPropKeys.has(key)) {
                customFields[key] = allProps[key];
            }
        }

        const organizationPayload: Record<string, any> = {
            name: name,
            owner_id: ownerId,
            visible_to: visibleTo,
        };

        
        if (address) {
            if (typeof address === 'string') {
                organizationPayload.address = { value: address }; 
            } else if (typeof address === 'object') {
                organizationPayload.address = address; // Assume it's already a structured object
            }
        }

        if (labelIds.length > 0) {
            organizationPayload.label_ids = labelIds;
        }

        // Assign the collected custom fields to the 'custom_fields' object in the payload
        if (Object.keys(customFields).length > 0) {
            organizationPayload.custom_fields = customFields;
        }

       
        const createdOrganizationResponse = await pipedriveApiCall<GetOrganizationResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/organizations',
            body: organizationPayload,
        });

        
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/organizationFields',
        });

        // This function transforms the custom fields in the *response* data
        const updatedOrganizationProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            createdOrganizationResponse.data,
        );

        return {
            ...createdOrganizationResponse,
            data: updatedOrganizationProperties,
        };
    },
});
