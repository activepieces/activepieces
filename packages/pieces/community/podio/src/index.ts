import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { podioAuth } from './lib/auth';
import { podioClient } from './lib/common/client';
import { createItemAction } from './lib/actions/create-item';
import { updateItemAction } from './lib/actions/update-item';
import { createTaskAction } from './lib/actions/create-task';
import { updateTaskAction } from './lib/actions/update-task';
import { attachFileAction } from './lib/actions/attach-file';
import { createCommentAction } from './lib/actions/create-comment';
import { createStatusAction } from './lib/actions/create-status';
import { findItemAction } from './lib/actions/find-item';
import { findTaskAction } from './lib/actions/find-task';
import { podioAiActions } from './lib/actions/ai';
import { newItemTrigger } from './lib/triggers/new-item';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newActivityTrigger } from './lib/triggers/new-activity';
import { itemUpdatedTrigger } from './lib/triggers/item-updated';
import { newOrganizationTrigger } from './lib/triggers/new-organization';
import { newWorkspaceTrigger } from './lib/triggers/new-workspace';

export const podio = createPiece({
  displayName: "Podio",
  auth: podioAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: "https://cdn.activepieces.com/pieces/podio.png",
  authors: ["sparkybug", "onyedikachi-david"],
  actions: [
    createItemAction,
    updateItemAction,
    createTaskAction,
    updateTaskAction,
    attachFileAction,
    createCommentAction,
    createStatusAction,
    findItemAction,
    findTaskAction,
    ...podioAiActions,
    createCustomApiCallAction({
      baseUrl: () => podioClient.baseUrl(),
      auth: podioAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newItemTrigger,
    newTaskTrigger,
    newActivityTrigger,
    itemUpdatedTrigger,
    newOrganizationTrigger,
    newWorkspaceTrigger,
  ],
});
