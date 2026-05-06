import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { signNowAuth } from './lib/common/auth';
import { cancelInviteAction } from './lib/actions/cancel-invite';
import { createDocumentFromTemplateAndSendInviteAction } from './lib/actions/create-document-from-template-and-send-invite';
import { createDocumentFromTemplateAndSendRoleBasedInviteAction } from './lib/actions/create-document-from-template-and-send-role-based-invite';
import { createDocumentGroupFromTemplateAndSendInviteAction } from './lib/actions/create-document-group-from-template-and-send-invite';
import { sendInviteAction } from './lib/actions/send-invite';
import { uploadDocumentAction } from './lib/actions/upload-document';
import { uploadDocumentAndExtractFieldsAction } from './lib/actions/upload-document-and-extract-fields';
import { customApiCallAction } from './lib/actions/custom-api-call';
import { documentCompletedTrigger } from './lib/triggers/document-completed';
import { documentDeletedTrigger } from './lib/triggers/document-deleted';
import { newDocumentTrigger } from './lib/triggers/new-document';
import { documentGroupCompletedTrigger } from './lib/triggers/document-group-completed';
import { documentUpdatedTrigger } from './lib/triggers/document-updated';

export const signNow = createPiece({
  displayName: 'SignNow',
  description:
    'eSignature platform for sending, signing, and managing documents.',
  auth: signNowAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sign-now.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [],
  actions: [
    cancelInviteAction,
    uploadDocumentAction,
    uploadDocumentAndExtractFieldsAction,
    sendInviteAction,
    createDocumentFromTemplateAndSendInviteAction,
    createDocumentFromTemplateAndSendRoleBasedInviteAction,
    createDocumentGroupFromTemplateAndSendInviteAction,
    customApiCallAction,
  ],
  triggers: [
    newDocumentTrigger,
    documentUpdatedTrigger,
    documentCompletedTrigger,
    documentDeletedTrigger,
    documentGroupCompletedTrigger,
  ],
});
