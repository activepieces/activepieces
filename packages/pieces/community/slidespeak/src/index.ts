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
import { slidespeakAuth } from './lib/auth';

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
           'X-API-key':auth.secret_text,
        }
      }
    })
  ],
  triggers: [newPresentationTrigger],
});
