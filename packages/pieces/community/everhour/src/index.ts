import { createPiece } from '@activepieces/pieces-framework';
import { everhourAuth } from './lib/auth';
import { createTaskAction } from './lib/actions/create-task';
import { startTimerAction } from './lib/actions/start-timer';
import { stopTimerAction } from './lib/actions/stop-timer';

export const everhour = createPiece({
    displayName: 'Everhour',
    logoUrl: 'add/everhour.png', // add the real logo here 
    authors: ['Slim-Hady'],
    auth: everhourAuth,
    actions: [
        createTaskAction,
        startTimerAction,
        stopTimerAction,
    ],
    triggers: [],
});

export { everhourAuth };