import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { everhourAuth } from '../auth';
import { everhourApiCall } from '../common/client';

export const stopTimerAction = createAction({
    auth: everhourAuth,
    name: 'stop-timer',
    displayName: 'Stop Timer',
    description: 'Stops the currently running timer. Fails if no timer is currently active.',
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