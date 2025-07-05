import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const airtopPageQueryAction = createAction({
    auth: airtopAuth,
    name: 'airtop_page_query',
    displayName: 'Page Query',
    description: 'Query a browser page to extract data or ask a question using AI.',
    props: {
        sessionId: sessionIdDropdown,
        windowId: windowIdDropdown,
        prompt: Property.LongText({
            displayName: 'Prompt',
            description: 'The question or instruction for Airtop AI (e.g., "What is the main idea of this page?")',
            required: true,
        }),
        clientRequestId: Property.ShortText({
            displayName: 'Client Request ID',
            required: false,
            description: 'Optional ID for tracking the request.',
        }),
        followPaginationLinks: Property.Checkbox({
            displayName: 'Follow Pagination Links',
            required: false,
            description: 'If true, Airtop will attempt to follow pagination to get more data (default: false).',
            defaultValue: false,
        }),
        costThresholdCredits: Property.Number({
            displayName: 'Cost Threshold (credits)',
            required: false,
            description: 'Cancel if credits exceed this amount (0 to disable, default is used otherwise).',
        }),
        timeThresholdSeconds: Property.Number({
            displayName: 'Time Threshold (seconds)',
            required: false,
            description: 'Cancel if operation takes longer than this time (0 to disable, default is used otherwise).',
        }),
    },
    async run({ auth, propsValue }) {
        const {
            sessionId,
            windowId,
            prompt,
            clientRequestId,
            followPaginationLinks,
            costThresholdCredits,
            timeThresholdSeconds,
        } = propsValue;

        const body: Record<string, any> = {
            prompt,
        };

        if (clientRequestId) body['clientRequestId'] = clientRequestId;

        if (
            followPaginationLinks !== undefined ||
            costThresholdCredits !== undefined ||
            timeThresholdSeconds !== undefined
        ) {
            body['configuration'] = {};
            if (followPaginationLinks !== undefined) body['configuration']['followPaginationLinks'] = followPaginationLinks;
            if (costThresholdCredits !== undefined) body['configuration']['costThresholdCredits'] = costThresholdCredits;
            if (timeThresholdSeconds !== undefined) body['configuration']['timeThresholdSeconds'] = timeThresholdSeconds;
        }

        const result = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: `/sessions/${sessionId}/windows/${windowId}/page-query`,
            body,
        });

        return result;
    },
});
