import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const airtopTakeScreenshotAction = createAction({
    auth: airtopAuth,
    name: 'airtop_take_screenshot',
    displayName: 'Take Screenshot',
    description: 'Capture a screenshot of the current browser window in Airtop.',
    props: {
        sessionId: sessionIdDropdown,
        windowId: windowIdDropdown,
        clientRequestId: Property.ShortText({
            displayName: 'Client Request ID',
            required: false,
            description: 'Optional ID for tracking the request.',
        }),
        costThresholdCredits: Property.Number({
            displayName: 'Cost Threshold (credits)',
            required: false,
            description: 'Optional. Operation will be cancelled if credits exceed this amount (0 to disable, default threshold otherwise).'
        }),
        timeThresholdSeconds: Property.Number({
            displayName: 'Time Threshold (seconds)',
            required: false,
            description: 'Optional. Operation will be cancelled if time exceeds this amount (0 to disable, default threshold otherwise).'
        }),
    },
    async run({ auth, propsValue }) {
        const {
            sessionId,
            windowId,
            clientRequestId,
            costThresholdCredits,
            timeThresholdSeconds,
        } = propsValue;

        const body: Record<string, any> = {};
        if (clientRequestId) body['clientRequestId'] = clientRequestId;

        if (
            costThresholdCredits !== undefined ||
            timeThresholdSeconds !== undefined
        ) {
            body['configuration'] = {};
            if (costThresholdCredits !== undefined) body['configuration']['costThresholdCredits'] = costThresholdCredits;
            if (timeThresholdSeconds !== undefined) body['configuration']['timeThresholdSeconds'] = timeThresholdSeconds;
        }

        const result = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: `/sessions/${sessionId}/windows/${windowId}/screenshot`,
            body,
        });

        return result;
    },
});
