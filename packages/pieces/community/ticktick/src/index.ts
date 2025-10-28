import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { completeTaskAction } from './lib/actions/complete-task';
import { createTaskAction } from './lib/actions/create-task';
import { deleteTaskAction } from './lib/actions/delete-task';
import { findTaskAction } from './lib/actions/find-task';
import { getProjectAction } from './lib/actions/get-project-by-id';
import { getTaskAction } from './lib/actions/get-task';
import { updateTaskAction } from './lib/actions/update-task';
import { newTaskCreatedTrigger } from './lib/triggers/new-task-created';

export const ticktickAuth = PieceAuth.OAuth2({
	authUrl: 'https://ticktick.com/oauth/authorize',
	tokenUrl: 'https://ticktick.com/oauth/token',
	required: true,
	scope: ['tasks:read', 'tasks:write'],
});

export const ticktick = createPiece({
	displayName: 'TickTick',
	logoUrl: 'https://cdn.activepieces.com/pieces/ticktick.png',
	auth: ticktickAuth,
	authors: ['onyedikachi-david', 'kishanprmr'],
	actions: [
		createTaskAction,
    updateTaskAction,
    getTaskAction,
    deleteTaskAction,
    completeTaskAction,
    findTaskAction,
    getProjectAction,
    createCustomApiCallAction({
      auth:ticktickAuth,
      baseUrl:()=>'https://api.ticktick.com/open/v1',
      authMapping:async (auth)=>{
        return {
          Authorization:`Bearer ${(auth as OAuth2PropertyValue).access_token}`
        }
      }
    })
	],
	triggers: [newTaskCreatedTrigger],
});
