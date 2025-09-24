import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/constants';
import { uploadDocumentAction } from './lib/actions/upload-document';
import { createPresentationAction } from './lib/actions/create-presentation';
import { editPresentationAction } from './lib/actions/edit-presentation';
import { getTaskStatusAction } from './lib/actions/get-task-status';
import { newPresentationTrigger } from './lib/triggers/new-presentation';
import { PieceCategory } from '@activepieces/shared';

export const slidespeakAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key by navigating to [API Settings](https://app.slidespeak.co/settings/developer).`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        url: BASE_URL + '/me',
        method: HttpMethod.GET,
        headers: {
          'X-API-key': auth,
        },
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

export const slidespeak = createPiece({
  displayName: 'SlideSpeak',
  auth: slidespeakAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/slidespeak.png',
  authors: ['rimjhimyadav'],
  categories:[PieceCategory.CONTENT_AND_FILES,PieceCategory.PRODUCTIVITY],
  actions: [
    createPresentationAction,
    editPresentationAction,
    getTaskStatusAction,
    uploadDocumentAction,
    createCustomApiCallAction({
      auth:slidespeakAuth,
      baseUrl:()=>BASE_URL,
      authMapping:async (auth)=>{
         return{
           'X-API-key':auth as string
        }
      }
    })
  ],
  triggers: [newPresentationTrigger],
});
