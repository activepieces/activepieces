import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { labelIdsProp, personIdProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetPersonResponse } from '../common/types'; 
import { HttpMethod } from '@activepieces/pieces-common';

export const addLabelToPersonAction = createAction({
    auth: pipedriveAuth,
    name: 'add-labels-to-person',
    displayName: 'Add Labels to Person',
    description: 'Adds existing labels to an existing person ', 
    props: {
        personId: personIdProp(true),
        labelIds: labelIdsProp('person', 'label_ids', true),
    },
    async run(context) {
        const { personId } = context.propsValue;
        const labelIds = (context.propsValue.labelIds as number[]) ?? [];

        const personUpdatePayload: Record<string, any> = {};

        if (labelIds.length > 0) {
            personUpdatePayload.label_ids = labelIds; 
        }

        // ✅ Use PATCH method for updates and specify v2 endpoint
        const updatedPersonResponse = await pipedriveApiCall<GetPersonResponse>({ 
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH, // ✅ Changed from HttpMethod.PUT to HttpMethod.PATCH
            resourceUri: `/v2/persons/${personId}`, // ✅ Updated to v2 endpoint
            body: {
                ...personUpdatePayload,
                // If this action were to also update custom fields, they would need to be nested here:
                // custom_fields: context.propsValue.customfields,
            },
        });

        // ✅ Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/personFields', // ✅ Updated to v2 endpoint
        });

        // This function transforms the custom fields in the *response* data
        const transformedPersonData = pipedriveTransformCustomFields( // ✅ Renamed variable for clarity
            customFieldsResponse,
            updatedPersonResponse.data,
        );

        return {
            ...updatedPersonResponse,
            data: transformedPersonData, // ✅ Assign transformed data to 'data'
        };
    },
});