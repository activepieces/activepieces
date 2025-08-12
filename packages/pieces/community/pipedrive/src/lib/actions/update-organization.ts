import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { organizationCommonProps, organizationIdProp, customFieldsProp } from '../common/props'; 
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetOrganizationResponse } from '../common/types'; 
import { HttpMethod } from '@activepieces/pieces-common';

export const updateOrganizationAction = createAction({
    auth: pipedriveAuth,
    name: 'update-organization',
    displayName: 'Update Organization',
    description: 'Updates an existing organization using Pipedrive API v2.',
    props: {
        organizationId: organizationIdProp(true), 
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
        }),
        ...organizationCommonProps, 
        customfields: customFieldsProp('organization'), 
    },
    async run(context) {
        const { name, ownerId, address, visibleTo, organizationId } = context.propsValue;

        
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

       
        const standardPropKeys = new Set([
            'organizationId', // Add organizationId to standard keys
            'name',
            'ownerId',
            'address',
            'visibleTo',
            'labelIds', // Add labelIds to standard keys
        ]);

        // Collect custom fields by filtering out standard properties from context.propsValue
        const customFields: Record<string, unknown> = {};
        
        const allProps = context.propsValue as Record<string, any>;
        for (const key in allProps) {
            if (key==='auth' || key ==='customfields'){
                continue; // Skip auth and customfields properties
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

        // Address field in v2 is a nested object.
        if (address) {
            if (typeof address === 'string') {
                organizationPayload.address = { value: address }; // Wrap string address in an object
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

        
        const updatedOrganizationResponse = await pipedriveApiCall<GetOrganizationResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH,
            resourceUri: `/v2/organizations/${organizationId}`,
            body: organizationPayload,
        });

        
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizationFields',
        });

        // This function transforms the custom fields in the *response* data
        const transformedOrganizationProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            updatedOrganizationResponse.data,
        );

        return {
            ...updatedOrganizationResponse,
            data: transformedOrganizationProperties,
        };
    },
});
