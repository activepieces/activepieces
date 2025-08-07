import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { personCommonProps, customFieldsProp } from '../common/props'; // ✅ Import customFieldsProp
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetPersonResponse } from '../common/types'; // ✅ Changed to GetPersonResponse
import { HttpMethod } from '@activepieces/pieces-common';

export const createPersonAction = createAction({
    auth: pipedriveAuth,
    name: 'create-person',
    displayName: 'Create Person',
    description: 'Creates a new person using Pipedrive API v2.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: true,
        }),
        ...personCommonProps, // Spreads common person properties
        customfields: customFieldsProp('person'), // ✅ Add dynamic custom fields for persons
    },
    async run(context) {
        const { name, ownerId, organizationId, marketing_status, visibleTo, firstName, lastName } =
            context.propsValue;

        // In v2, phone and email are arrays of objects.
        const rawPhones = (context.propsValue.phone as string[]) ?? [];
        const rawEmails = (context.propsValue.email as string[]) ?? [];
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

        // Define standard properties that are NOT custom fields for persons
        const standardPropKeys = new Set([
            'name',
            'ownerId',
            'organizationId',
            'marketing_status',
            'visibleTo',
            'firstName',
            'lastName',
            'phone', // Include phone as a standard prop
            'email', // Include email as a standard prop
            'labelIds', // Include labelIds as a standard prop
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

        // Transform phone and email arrays to the v2 expected format: array of objects
        const phones = rawPhones.map((value, index) => ({
            value,
            label: 'work', // Default label, can be enhanced with more specific properties if needed
            primary: index === 0, // Mark the first one as primary
        }));

        const emails = rawEmails.map((value, index) => ({
            value,
            label: 'work', // Default label, can be enhanced with more specific properties if needed
            primary: index === 0, // Mark the first one as primary
        }));

        const personPayload: Record<string, any> = {
            name: name,
            owner_id: ownerId,
            org_id: organizationId,
            marketing_status: marketing_status,
            visible_to: visibleTo,
            first_name: firstName,
            last_name: lastName,
        };

        if (phones.length > 0) {
            personPayload.phones = phones;
        }

        if (emails.length > 0) {
            personPayload.emails = emails;
        }

        if (labelIds.length > 0) {
            personPayload.label_ids = labelIds;
        }

        // Assign the collected custom fields to the 'custom_fields' object in the payload
        if (Object.keys(customFields).length > 0) {
            personPayload.custom_fields = customFields;
        }

        // ✅ Use v2 endpoint for creating a person and expect GetPersonResponse
        const createdPersonResponse = await pipedriveApiCall<GetPersonResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/persons',
            body: personPayload,
        });

        // ✅ Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/personFields',
        });

        // This function transforms the custom fields in the *response* data
        const updatedPersonProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            createdPersonResponse.data,
        );

        return {
            ...createdPersonResponse,
            data: updatedPersonProperties,
        };
    },
});
