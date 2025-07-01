import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const airtopHoverOnElementAction = createAction({
    auth: airtopAuth,
    name: 'airtop_hover_on_element',
    displayName: 'Hover on Element',
    description: 'Moves mouse pointer over an element in the specified browser window.',
    props: {
        sessionId: sessionIdDropdown,
        windowId: windowIdDropdown,
        elementDescription: Property.ShortText({
            displayName: 'Element Description',
            required: true,
            description: `A natural language description of where to hover (e.g. "the search box in the top right corner").`
        }),
        clientRequestId: Property.ShortText({
            displayName: 'Client Request ID',
            required: false,
            description: 'Optional ID for tracking the request.',
        }),
        costThresholdCredits: Property.Number({
            displayName: 'Cost Threshold (credits)',
            required: false,
            description: 'Optional: Operation will be cancelled if credits exceed this amount (0 to disable, default threshold otherwise).'
        }),
        timeThresholdSeconds: Property.Number({
            displayName: 'Time Threshold (seconds)',
            required: false,
            description: 'Optional: Operation will be cancelled if time exceeds this amount (0 to disable, default threshold otherwise).'
        }),
    },
    async run({ auth, propsValue }) {
        const {
            sessionId,
            windowId,
            elementDescription,
            clientRequestId,
            costThresholdCredits,
            timeThresholdSeconds,
        } = propsValue;

        const body: Record<string, any> = {
            elementDescription,
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
            resourceUri: `/sessions/${sessionId}/windows/${windowId}/hover`,
            body,
        });

        return result;
    },
});
