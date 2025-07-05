import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const airtopSmartScrapeAction = createAction({
    auth: airtopAuth,
    name: 'airtop_smart_scrape',
    displayName: 'Smart Scrape',
    description: 'Scrape a browser window and return the content as markdown.',
    props: {
        sessionId: sessionIdDropdown,
        windowId: windowIdDropdown,
        clientRequestId: Property.ShortText({
            displayName: 'Client Request ID',
            required: false,
            description: 'Optional ID for tracking this request.',
        }),
        costThresholdCredits: Property.Number({
            displayName: 'Cost Threshold (credits)',
            required: false,
            description: 'Cancel if credits exceed this amount (0 to disable, default otherwise).',
        }),
        timeThresholdSeconds: Property.Number({
            displayName: 'Time Threshold (seconds)',
            required: false,
            description: 'Cancel if time exceeds this amount (0 to disable, default otherwise).',
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
        if (costThresholdCredits !== undefined || timeThresholdSeconds !== undefined) {
            body['configuration'] = {};
            if (costThresholdCredits !== undefined) body['configuration']['costThresholdCredits'] = costThresholdCredits;
            if (timeThresholdSeconds !== undefined) body['configuration']['timeThresholdSeconds'] = timeThresholdSeconds;
        }

        const result = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: `/sessions/${sessionId}/windows/${windowId}/scrape-content`,
            body,
        });

        return result;
    },
});
