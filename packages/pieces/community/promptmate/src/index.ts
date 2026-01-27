
    import {
      AuthenticationType,
      createCustomApiCallAction,
      httpClient,
      HttpMethod,
    } from '@activepieces/pieces-common';
    import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
    import { PieceCategory } from '@activepieces/shared';
    import { listApps } from './lib/actions/list-apps';
    import { runApp } from './lib/actions/run-app';
    import { getJobStatus } from './lib/actions/get-job-status';
    import { getAppDetails } from './lib/actions/get-app-details';
    import { getLastResults } from './lib/actions/get-last-results';
    import { useTemplate } from './lib/actions/use-template';
    import { getUserInfo } from './lib/actions/get-user-info';
    import { listProjects } from './lib/actions/list-projects';
    import { newAppResult } from './lib/triggers/new-app-result';

    export const promptmateAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your PromptMate API key',
      required: true,
      validate: async (auth) => {
        try {
          await httpClient.sendRequest({
            url: 'https://api.promptmate.io/v1/apps',
            method: HttpMethod.GET,
            headers: {
              'x-api-key': auth.auth as string,
            },
          });
          return {
            valid: true,
          };
        } catch (e) {
          return {
            valid: false,
            error: 'Invalid API key',
          };
        }
      },
    });

    export const promptmate = createPiece({
      displayName: "PromptMate",
      description: "AI-powered automation platform",
      auth: promptmateAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/promptmate.png",
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
      authors: ["onyedikachi-david"],
      actions: [
        listApps,
        runApp,
        getJobStatus,
        getAppDetails,
        getLastResults,
        useTemplate,
        getUserInfo,
        listProjects,
        createCustomApiCallAction({
          baseUrl: () => 'https://api.promptmate.io/v1',
          auth: promptmateAuth,
          authMapping: async (auth) => ({
            'x-api-key': auth.secret_text,
          }),
        }),
      ],
      triggers: [newAppResult],
    });
    