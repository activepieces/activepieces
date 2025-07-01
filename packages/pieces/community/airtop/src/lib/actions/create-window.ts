import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown, urlProperty } from '../common/props';

const waitUntilOptions = [
    { label: 'load (default)', value: 'load' },
    { label: 'domContentLoaded', value: 'domContentLoaded' },
    { label: 'complete', value: 'complete' },
    { label: 'noWait', value: 'noWait' }
];

export const airtopCreateWindowAction = createAction({
    auth: airtopAuth,
    name: 'airtop_create_window',
    displayName: 'Create Browser Window',
    description: 'Opens a new browser window within a session, optionally navigating to a URL.',
    props: {
        sessionId: sessionIdDropdown,
        url: urlProperty,
        screenResolution: Property.ShortText({
            displayName: 'Screen Resolution',
            description: 'E.g., 1280x720. Defaults to 1280x720 if not set.',
            required: false,
        }),
        waitUntil: Property.StaticDropdown({
            displayName: 'Wait Until Event',
            description: 'When to consider navigation done (see docs). Default: load',
            required: false,
            options: {
                disabled: false,
                options: waitUntilOptions,
            }
        }),
        waitUntilTimeoutSeconds: Property.Number({
            displayName: 'Wait Until Timeout (seconds)',
            description: 'How long to wait for page load (default 30).',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const {
            sessionId,
            url,
            screenResolution,
            waitUntil,
            waitUntilTimeoutSeconds
        } = propsValue;

        if (waitUntilTimeoutSeconds !== undefined && waitUntilTimeoutSeconds < 1) {
            throw new Error('Wait Until Timeout (seconds) must be at least 1.');
        }

        const body: Record<string, unknown> = {};

        if (url) body['url'] = url;
        if (screenResolution) body['screenResolution'] = screenResolution;
        if (waitUntil) body['waitUntil'] = waitUntil;
        if (waitUntilTimeoutSeconds) body['waitUntilTimeoutSeconds'] = waitUntilTimeoutSeconds;

        const result = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: `/sessions/${sessionId}/windows`,
            body,
        });

        return result;
    },
});
