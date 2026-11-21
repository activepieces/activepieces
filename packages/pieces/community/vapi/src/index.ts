import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { vapiAuth, VAPI_BASE_URL } from './lib/auth';
import { createCall } from './lib/actions/create-call';
import { placeCall } from './lib/actions/place-call';
import { getCall } from './lib/actions/get-call';
import { getCallResult } from './lib/actions/get-call-result';
import { listCalls } from './lib/actions/list-calls';
import { findCalls } from './lib/actions/find-calls';
import { deleteCall } from './lib/actions/delete-call';
import { updateAssistant } from './lib/actions/update-assistant';
import { updateAssistantSettings } from './lib/actions/update-assistant-settings';
import { listAssistants } from './lib/actions/list-assistants';
import { findAssistant } from './lib/actions/find-assistant';
import { getAssistant } from './lib/actions/get-assistant';
import { createAssistant } from './lib/actions/create-assistant';
import { deleteAssistant } from './lib/actions/delete-assistant';
import { listPhoneNumbers } from './lib/actions/list-phone-numbers';
import { findPhoneNumber } from './lib/actions/find-phone-number';
import { getPhoneNumber } from './lib/actions/get-phone-number';
import { updatePhoneNumber } from './lib/actions/update-phone-number';
import { listTools } from './lib/actions/list-tools';
import { findTool } from './lib/actions/find-tool';
import { getTool } from './lib/actions/get-tool';
import { createFunctionTool } from './lib/actions/create-function-tool';
import { deleteTool } from './lib/actions/delete-tool';
import { listSquads } from './lib/actions/list-squads';
import { findSquad } from './lib/actions/find-squad';
import { getSquad } from './lib/actions/get-squad';
import { createSquad } from './lib/actions/create-squad';
import { deleteSquad } from './lib/actions/delete-squad';
import { listFiles } from './lib/actions/list-files';
import { findFile } from './lib/actions/find-file';
import { getFile } from './lib/actions/get-file';
import { uploadFile } from './lib/actions/upload-file';
import { deleteFile } from './lib/actions/delete-file';
import { callEnded } from './lib/triggers/call-ended';

export const vapi = createPiece({
  displayName: 'Vapi',
  description:
    'AI voice agent platform. Place outbound calls, manage assistants, phone numbers, tools, squads and knowledge-base files, and react to ended calls.',
  auth: vapiAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/vapi.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Harmatta'],
  actions: [
    createCall,
    placeCall,
    getCall,
    getCallResult,
    listCalls,
    findCalls,
    deleteCall,
    updateAssistant,
    updateAssistantSettings,
    listAssistants,
    findAssistant,
    getAssistant,
    createAssistant,
    deleteAssistant,
    listPhoneNumbers,
    findPhoneNumber,
    getPhoneNumber,
    updatePhoneNumber,
    listTools,
    findTool,
    getTool,
    createFunctionTool,
    deleteTool,
    listSquads,
    findSquad,
    getSquad,
    createSquad,
    deleteSquad,
    listFiles,
    findFile,
    getFile,
    uploadFile,
    deleteFile,
    createCustomApiCallAction({
      baseUrl: () => VAPI_BASE_URL,
      auth: vapiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [callEnded],
});
