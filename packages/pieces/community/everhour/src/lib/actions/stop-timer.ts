import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { everhourAuth } from '../auth';
import { everhourApiCall } from '../common/client';

export const stopTimerAction = createAction({
    auth: everhourAuth,
    name: 'stop-timer',
    displayName: 'Stop Timer',
    description: 'Stops the currently running timer. Fails if no timer is currently active.',
    audience: 'both',
    aiMetadata: { description: 'Stops the Everhour timer that is currently running and records its tracked time; takes no input. Use when an agent needs to end the active timing session. Not idempotent: it fails if no timer is active, so it cannot be safely repeated after the timer has already been stopped.', idempotent: false },
    props: {},
    async run(context) {
        const response = await everhourApiCall({
            apiKey: context.auth.secret_text,
            method: HttpMethod.DELETE,
            resourceUri: `/timers/current`,
        });

        return response;
    },
});