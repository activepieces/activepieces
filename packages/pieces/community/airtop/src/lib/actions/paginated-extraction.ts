import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const airtopPaginatedExtractionAction = createAction({
    auth: airtopAuth,
    name: 'airtop_paginated_extraction',
    displayName: 'Paginated Extraction',
    description: 'Extract content from paginated or dynamically loaded pages using Airtop AI.',
    props: {
        sessionId: sessionIdDropdown,
        windowId: windowIdDropdown,
        prompt: Property.LongText({
            displayName: 'Extraction Prompt',
            required: true,
            description: 'Describe the data to extract and the pagination behavior (e.g., "Go through 5 pages and extract the product name and price from each item.")',
        }),
        clientRequestId: Property.ShortText({
            displayName: 'Client Request ID',
            required: false,
            description: 'Optional ID for tracking the request.',
        }),
        costThresholdCredits: Property.Number({
            displayName: 'Cost Threshold (credits)',
            required: false,
            description: 'Cancel if credits exceed this value. 0 disables, otherwise use API default.',
        }),
        timeThresholdSeconds: Property.Number({
            displayName: 'Time Threshold (seconds)',
            required: false,
            description: 'Cancel if operation takes longer than this. 0 disables, otherwise use API default.',
        }),
    },
    async run({ auth, propsValue }) {
        const {
            sessionId,
            windowId,
            prompt,
            clientRequestId,
            costThresholdCredits,
            timeThresholdSeconds,
        } = propsValue;

        const body: Record<string, any> = {
            prompt,
        };
        if (clientRequestId) body['clientRequestId'] = clientRequestId;
        if (costThresholdCredits || timeThresholdSeconds) {
            body['configuration'] = {};
            if (costThresholdCredits) body['configuration']['costThresholdCredits'] = costThresholdCredits;
            if (timeThresholdSeconds) body['configuration']['timeThresholdSeconds'] = timeThresholdSeconds;
        }

        const result = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: `/sessions/${sessionId}/windows/${windowId}/paginated-extraction`,
            body,
        });

        return result;
    },
});
