import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, windowIdDropdown, selectorProperty } from '../common/props';

export const airtopClickElementAction = createAction({
    auth: airtopAuth,
    name: 'airtop_click_element',
    displayName: 'Click an Element',
    description: 'Simulates a click on a page element described by selector, text, or description.',
    props: {
        sessionId: sessionIdDropdown,
        windowId: windowIdDropdown,
        elementDescription: Property.ShortText({
            displayName: 'Element Selector or Description',
            required: true,
            description: 'CSS selector, XPath, visible text, or natural language description (e.g., "the login button").',
        }),
        waitForNavigation: Property.Checkbox({
            displayName: 'Wait for Navigation',
            required: false,
            defaultValue: false,
            description: 'Wait for navigation after click (default: false).',
        }),
        clientRequestId: Property.ShortText({
            displayName: 'Client Request ID',
            required: false,
            description: 'Optional ID for tracking the request.',
        }),
        costThresholdCredits: Property.Number({
            displayName: 'Cost Threshold (credits)',
            required: false,
            description: 'Cancel if credits exceed this value (0 to disable, otherwise use API default).',
        }),
        timeThresholdSeconds: Property.Number({
            displayName: 'Time Threshold (seconds)',
            required: false,
            description: 'Cancel if operation takes longer than this (0 to disable, otherwise use API default).',
        }),
    },
    async run({ auth, propsValue }) {
        const {
            sessionId,
            windowId,
            elementDescription,
            waitForNavigation,
            clientRequestId,
            costThresholdCredits,
            timeThresholdSeconds,
        } = propsValue;

        const body: Record<string, any> = {
            elementDescription,
        };
        if (waitForNavigation !== undefined) body['waitForNavigation'] = waitForNavigation;
        if (clientRequestId) body['clientRequestId'] = clientRequestId;
        if (costThresholdCredits || timeThresholdSeconds) {
            body['configuration'] = {};
            if (costThresholdCredits) body['configuration']['costThresholdCredits'] = costThresholdCredits;
            if (timeThresholdSeconds) body['configuration']['timeThresholdSeconds'] = timeThresholdSeconds;
        }

        const result = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: `/sessions/${sessionId}/windows/${windowId}/click`,
            body,
        });

        return result;
    },
});
