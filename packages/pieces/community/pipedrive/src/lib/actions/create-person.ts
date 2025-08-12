import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { personCommonProps, customFieldsProp } from '../common/props'; 
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetPersonResponse } from '../common/types'; 
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
        ...personCommonProps, 
        customfields: customFieldsProp('person'), 
    },
    async run(context) {
        const { name, ownerId, organizationId, marketing_status, visibleTo, firstName, lastName } =
            context.propsValue;

        
        const rawPhones = (context.propsValue.phone as string[]) ?? [];
        const rawEmails = (context.propsValue.email as string[]) ?? [];
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

        
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

        
        const phones = rawPhones.map((value, index) => ({
            value,
            label: 'work', 
            primary: index === 0, 
        }));

        const emails = rawEmails.map((value, index) => ({
            value,
            label: 'work', 
            primary: index === 0, 
        }));

        const personPayload: Record<string, any> = {
            name,
            owner_id: ownerId,
            org_id: organizationId,
            visible_to: visibleTo,
            first_name: firstName,
            last_name: lastName,
        };

        // Phones and emails
        if (phones.length) personPayload.phone = phones;
        if (emails.length) personPayload.email = emails;
        if (labelIds.length) personPayload.label_ids = labelIds;

        // Flatten custom fields into top-level keys
        for (const [key, value] of Object.entries(allProps)) {
            if (!standardPropKeys.has(key) && key !== 'auth' && key !== 'customfields') {
                personPayload[key] = value;
            }
        }



        
        if (Object.keys(customFields).length > 0) {
            personPayload.custom_fields = customFields;
        }

        
        const createdPersonResponse = await pipedriveApiCall<GetPersonResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/persons',
            body: personPayload,
        });

        
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/personFields',
        });

        
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
