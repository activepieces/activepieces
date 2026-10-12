import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { newEmail } from './lib/triggers/new-email';
import { imapAuth } from './lib/common';
import { markEmailAsRead } from './lib/actions/mark-email-read';
import { copyEmail } from './lib/actions/copy-email';
import { deleteEmail } from './lib/actions/delete-email';
import { moveEmail } from './lib/actions/move-email';
import { listFolders } from './lib/actions/list-folders';
import { getFolderStatus } from './lib/actions/get-folder-status';
import { createFolder } from './lib/actions/create-folder';
import { renameFolder } from './lib/actions/rename-folder';
import { deleteFolder } from './lib/actions/delete-folder';
import { getQuota } from './lib/actions/get-quota';
import { searchEmails } from './lib/actions/search-emails';
import { getEmail } from './lib/actions/get-email';
import { updateEmailFlags } from './lib/actions/update-email-flags';
import { moveEmails } from './lib/actions/move-emails';
import { copyEmails } from './lib/actions/copy-emails';
import { trashEmails } from './lib/actions/trash-emails';
import { archiveEmails } from './lib/actions/archive-emails';
import { deleteEmails } from './lib/actions/delete-emails';
import { createDraft } from './lib/actions/create-draft';

export const imapPiece = createPiece({
  displayName: 'IMAP',
  description: 'Watch for new emails and copy, move, mark or delete them over IMAP.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/imap.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'simonc'],
  auth: imapAuth,
  actions: [
    markEmailAsRead,
    copyEmail,
    moveEmail,
    deleteEmail,
    listFolders,
    getFolderStatus,
    createFolder,
    renameFolder,
    deleteFolder,
    getQuota,
    searchEmails,
    getEmail,
    updateEmailFlags,
    moveEmails,
    copyEmails,
    trashEmails,
    archiveEmails,
    deleteEmails,
    createDraft,
  ],
  triggers: [newEmail],
});
