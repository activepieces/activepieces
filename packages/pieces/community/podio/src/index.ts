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

    export const podioAuth = PieceAuth.OAuth2({
      description: `
        To connect to Podio:
        1. Sign in to your Podio account
        2. Go to https://developers.podio.com/api/getting-started
        3. Create a new app and get your client credentials
        4. Copy the Client ID and Client Secret to authenticate
        5. Complete the OAuth flow to obtain access tokens
      `,
      authUrl: 'https://podio.com/oauth/authorize',
      tokenUrl: 'https://podio.com/oauth/token',
      required: true,
      scope: [],
      validate: async ({ auth }) => {
        try {
          const validation = validateAuthData(auth);
          if (!validation.valid) {
            return { valid: false, error: validation.error || 'Authentication validation failed' };
          }

          const response = await podioApiCall({
            method: HttpMethod.GET,
            accessToken: auth.access_token,
            resourceUri: '/user/status',
          });

          if (response && typeof response === 'object') {
            return { valid: true };
          }

          return { valid: false, error: 'Failed to validate connection with Podio API' };
        } catch (error: any) {
          if (error.response?.status === 401) {
            return { valid: false, error: 'Invalid or expired access token. Please reconnect your Podio account.' };
          }
          
          if (error.response?.status === 403) {
            return { valid: false, error: 'Access denied. Please check your Podio permissions.' };
          }

          return { 
            valid: false, 
            error: `Connection validation failed: ${error.message || 'Unknown error occurred'}` 
          };
        }
      },
    });

    export const podio = createPiece({
      displayName: "Podio",
      auth: podioAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/podio.png",
      authors: ["sparkybug"],
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
    