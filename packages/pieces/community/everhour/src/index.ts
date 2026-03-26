import { createPiece } from '@activepieces/pieces-framework';
import { everhourAuth } from './lib/auth';
import { createTaskAction } from './lib/actions/create-task';
import { startTimerAction } from './lib/actions/start-timer';
import { stopTimerAction } from './lib/actions/stop-timer';

export const everhour = createPiece({
    displayName: 'Everhour',
    auth: everhourAuth,
    minimumSupportedRelease: '0.20.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/everhour.png',
    authors: ['Slim-Hady'],
    actions: [createTaskAction, startTimerAction, stopTimerAction],
    triggers: [],
});