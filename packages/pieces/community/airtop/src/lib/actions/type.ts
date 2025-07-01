import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const airtopTypeAction = createAction({
    auth: airtopAuth,
    name: 'airtop_type',
    displayName: 'Type in Element',
    description: 'Types text into a specific element or input field in a browser window.',
    props: {
        sessionId: sessionIdDropdown,
        windowId: windowIdDropdown,
        text: Property.ShortText({
            displayName: 'Text to Type',
            required: true,
            description: 'The text to type into the browser window.',
        }),
        elementDescription: Property.ShortText({
            displayName: 'Element Description',
            required: false,
            description: 'Natural language description of where to type (e.g., "the search box", "username field").',
        }),
        clearInputField: Property.Checkbox({
            displayName: 'Clear Input Field Before Typing',
            required: false,
            description: 'If true, clears the input field before typing.',
            defaultValue: false,
        }),
        pressEnterKey: Property.Checkbox({
            displayName: 'Press Enter After Typing',
            required: false,
            description: 'Simulate pressing Enter key after typing.',
            defaultValue: false,
        }),
        pressTabKey: Property.Checkbox({
            displayName: 'Press Tab After Typing',
            required: false,
            description: 'Simulate pressing Tab key after typing (after Enter if both are enabled).',
            defaultValue: false,
        }),
        waitForNavigation: Property.Checkbox({
            displayName: 'Wait for Navigation',
            required: false,
            description: 'Wait for navigation to complete after typing.',
            defaultValue: false,
        }),
        clientRequestId: Property.ShortText({
            displayName: 'Client Request ID',
            required: false,
            description: 'Optional ID for tracking the request.',
        }),
        costThresholdCredits: Property.Number({
            displayName: 'Cost Threshold (credits)',
            required: false,
            description: 'Operation will be cancelled if credits exceed this amount (0 to disable, default otherwise).',
        }),
        timeThresholdSeconds: Property.Number({
            displayName: 'Time Threshold (seconds)',
            required: false,
            description: 'Operation will be cancelled if time exceeds this amount (0 to disable, default otherwise).',
        }),
    },
    async run({ auth, propsValue }) {
        const {
            sessionId,
            windowId,
            text,
            elementDescription,
            clearInputField,
            pressEnterKey,
            pressTabKey,
            waitForNavigation,
            clientRequestId,
            costThresholdCredits,
            timeThresholdSeconds,
        } = propsValue;

        const body: Record<string, any> = {
            text,
        };
        if (elementDescription) body['elementDescription'] = elementDescription;
        if (clearInputField !== undefined) body['clearInputField'] = clearInputField;
        if (pressEnterKey !== undefined) body['pressEnterKey'] = pressEnterKey;
        if (pressTabKey !== undefined) body['pressTabKey'] = pressTabKey;
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
            resourceUri: `/sessions/${sessionId}/windows/${windowId}/type`,
            body,
        });

        return result;
    },
});
