import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { dropboxCopyFile } from './lib/actions/copy-file';
import { dropboxCopyFolder } from './lib/actions/copy-folder';
import { dropboxCreateNewFolder } from './lib/actions/create-new-folder';
import { dropboxCreateNewTextFile } from './lib/actions/create-new-text-file';
import { dropboxDeleteFile } from './lib/actions/delete-file';
import { dropboxDeleteFolder } from './lib/actions/delete-folder';
import { dropboxGetFileLink } from './lib/actions/get-file-link';
import { dropboxListAFolder } from './lib/actions/list-a-folder';
import { dropboxMoveFile } from './lib/actions/move-file';
import { dropboxMoveFolder } from './lib/actions/move-folder';
import { dropboxSearch } from './lib/actions/search';
import { dropboxUploadFile } from './lib/actions/upload-file';
import { dropboxDownloadFile } from './lib/actions/download-file';
import { dropboxAuth } from './lib/auth';
import { dropboxGetFileMetadata } from './lib/actions/get-file-metadata';
import { dropboxListFileRevisions } from './lib/actions/list-file-revisions';
import { dropboxRestoreFile } from './lib/actions/restore-file';
import { dropboxCreateCopyReference } from './lib/actions/create-copy-reference';
import { dropboxSaveCopyReference } from './lib/actions/save-copy-reference';
import { dropboxLockFile } from './lib/actions/lock-file';
import { dropboxUnlockFile } from './lib/actions/unlock-file';
import { dropboxGetFileLock } from './lib/actions/get-file-lock';
import { dropboxCreateUploadLink } from './lib/actions/create-upload-link';
import { dropboxDownloadFolderAsZip } from './lib/actions/download-folder-as-zip';
import { dropboxGetFilePreview } from './lib/actions/get-file-preview';
import { dropboxGetFileThumbnail } from './lib/actions/get-file-thumbnail';
import { dropboxGetThumbnailsBatch } from './lib/actions/get-thumbnails-batch';
import { dropboxSaveUrl } from './lib/actions/save-url';
import { dropboxGetSaveUrlStatus } from './lib/actions/get-save-url-status';
import { dropboxStartCopyBatch } from './lib/actions/start-copy-batch';
import { dropboxGetCopyBatchStatus } from './lib/actions/get-copy-batch-status';
import { dropboxStartMoveBatch } from './lib/actions/start-move-batch';
import { dropboxGetMoveBatchStatus } from './lib/actions/get-move-batch-status';
import { dropboxStartDeleteBatch } from './lib/actions/start-delete-batch';
import { dropboxGetDeleteBatchStatus } from './lib/actions/get-delete-batch-status';
import { dropboxStartCreateFolderBatch } from './lib/actions/start-create-folder-batch';
import { dropboxGetCreateFolderBatchStatus } from './lib/actions/get-create-folder-batch-status';
import { dropboxCopyEntry } from './lib/actions/copy-entry';
import { dropboxMoveEntry } from './lib/actions/move-entry';
import { dropboxDeleteEntry } from './lib/actions/delete-entry';
import { dropboxNewFolder } from './lib/triggers/new-folder';

export const dropbox = createPiece({
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/dropbox.png',
  actions: [
    dropboxSearch,
    dropboxCreateNewTextFile,
    dropboxUploadFile,
    dropboxDownloadFile,
    dropboxGetFileLink,
    dropboxDeleteFile,
    dropboxMoveFile,
    dropboxCopyFile,
    dropboxCreateNewFolder,
    dropboxDeleteFolder,
    dropboxMoveFolder,
    dropboxCopyFolder,
    dropboxListAFolder,
    dropboxGetFileMetadata,
    dropboxListFileRevisions,
    dropboxRestoreFile,
    dropboxCreateCopyReference,
    dropboxSaveCopyReference,
    dropboxLockFile,
    dropboxUnlockFile,
    dropboxGetFileLock,
    dropboxCreateUploadLink,
    dropboxDownloadFolderAsZip,
    dropboxGetFilePreview,
    dropboxGetFileThumbnail,
    dropboxGetThumbnailsBatch,
    dropboxSaveUrl,
    dropboxGetSaveUrlStatus,
    dropboxStartCopyBatch,
    dropboxGetCopyBatchStatus,
    dropboxStartMoveBatch,
    dropboxGetMoveBatchStatus,
    dropboxStartDeleteBatch,
    dropboxGetDeleteBatchStatus,
    dropboxStartCreateFolderBatch,
    dropboxGetCreateFolderBatchStatus,
    dropboxCopyEntry,
    dropboxMoveEntry,
    dropboxDeleteEntry,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.dropboxapi.com/2',
      auth: dropboxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  displayName: 'Dropbox',
  description: 'Cloud storage and file synchronization',
  authors: [
    'BastienMe',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
  ],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [dropboxNewFolder],
  auth: dropboxAuth,
});
