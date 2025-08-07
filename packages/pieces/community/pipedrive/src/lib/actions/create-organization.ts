import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { organizationCommonProps, customFieldsProp } from '../common/props'; // ✅ Import customFieldsProp
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetOrganizationResponse } from '../common/types'; // ✅ Changed to GetOrganizationResponse
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
        ...organizationCommonProps, // Spreads common organization properties
        customfields: customFieldsProp('organization'), // ✅ Add dynamic custom fields for organizations
    },
    async run(context) {
        const { name, ownerId, address, visibleTo } = context.propsValue;

        // `label_ids` replaces the `label` field in v1 and expects an array of numbers.
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

        // Define standard properties that are NOT custom fields for organizations
        const standardPropKeys = new Set([
            'name',
            'ownerId',
            'address',
            'visibleTo',
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

        // ✅ Use v2 endpoint for creating an organization and expect GetOrganizationResponse
        const createdOrganizationResponse = await pipedriveApiCall<GetOrganizationResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/organizations',
            body: organizationPayload,
        });

        // ✅ Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/organizationFields',
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
