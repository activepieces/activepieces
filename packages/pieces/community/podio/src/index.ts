    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common';
    import { createItemAction } from './lib/actions/create-item';
    import { updateItemAction } from './lib/actions/update-item';
    import { createTaskAction } from './lib/actions/create-task';
    import { updateTaskAction } from './lib/actions/update-task';
    import { attachFileAction } from './lib/actions/attach-file';
    import { createCommentAction } from './lib/actions/create-comment';
    import { createStatusAction } from './lib/actions/create-status';
    import { findItemAction } from './lib/actions/find-item';
    import { findTaskAction } from './lib/actions/find-task';
    import { newItemTrigger } from './lib/triggers/new-item';
    import { newTaskTrigger } from './lib/triggers/new-task';
    import { newActivityTrigger } from './lib/triggers/new-activity';
    import { itemUpdatedTrigger } from './lib/triggers/item-updated';
    import { newOrganizationTrigger } from './lib/triggers/new-organization';
    import { newWorkspaceTrigger } from './lib/triggers/new-workspace';
    import { podioApiCall, validateAuthData } from './lib/common';
import { podioAuth } from './lib/auth';

        export const podio = createPiece({
      displayName: "Podio",
      auth: podioAuth,
      minimumSupportedRelease: '0.36.1',
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
            createCustomApiCallAction({
      baseUrl: () => 'https://api.podio.com',
      auth: podioAuth,
      authMapping: async (auth: any) => ({
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
    