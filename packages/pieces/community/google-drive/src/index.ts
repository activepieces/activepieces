import {
  createPiece,
} from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { addPermission } from './lib/action/add-permission.action';
import { googleDriveCreateNewFolder } from './lib/action/create-new-folder';
import { googleDriveCreateNewTextFile } from './lib/action/create-new-text-file';
import { deletePermission } from './lib/action/delete-permission.action';
import { duplicateFileAction } from './lib/action/duplicate-file.action';
import { googleDriveGetResourceById } from './lib/action/get-file-by-id';
import { googleDriveListFiles } from './lib/action/list-files.action';
import { readFile } from './lib/action/read-file';
import { saveFileAsPdf } from './lib/action/save-file-as-pdf.action';
import { googleDriveSearchFolder } from './lib/action/search-folder-or-file.action';
import { googleDriveUploadFile } from './lib/action/upload-file';
import { newFile } from './lib/triggers/new-file';
import { newFolder } from './lib/triggers/new-folder';
import { setPublicAccess } from './lib/action/set-public-access';
import { moveFileAction } from './lib/action/move-file';
import { googleDriveDeleteFile } from './lib/action/delete-file';
import { googleDriveTrashFile } from './lib/action/send-to-trash';
import { googleDriveAuth, getAccessToken, GoogleDriveAuthValue } from './lib/auth';

// Phase-3 audience:'ai' agent atomics (full Composio-parity agent surface)
import { driveCreateFolder } from './lib/action/drive-create-folder';
import { driveCreateFileFromText } from './lib/action/drive-create-file-from-text';
import { driveUploadFile } from './lib/action/drive-upload-file';
import { driveUploadFromUrl } from './lib/action/drive-upload-from-url';
import { driveReplaceFileContent } from './lib/action/drive-replace-file-content';
import { driveDownloadFile } from './lib/action/drive-download-file';
import { driveExportWorkspaceFile } from './lib/action/drive-export-workspace-file';
import { driveGetFile } from './lib/action/drive-get-file';
import { driveListFiles } from './lib/action/drive-list-files';
import { driveSearchFiles } from './lib/action/drive-search-files';
import { driveCopyFile } from './lib/action/drive-copy-file';
import { driveMoveFile } from './lib/action/drive-move-file';
import { driveUpdateFileMetadata } from './lib/action/drive-update-file-metadata';
import { driveSaveFileAsPdf } from './lib/action/drive-save-file-as-pdf';
import { driveTrashFile } from './lib/action/drive-trash-file';
import { driveUntrashFile } from './lib/action/drive-untrash-file';
import { driveDeleteFile } from './lib/action/drive-delete-file';
import { driveEmptyTrash } from './lib/action/drive-empty-trash';
import { driveShareFile } from './lib/action/drive-share-file';
import { driveSetPublicAccess } from './lib/action/drive-set-public-access';
import { driveListPermissions } from './lib/action/drive-list-permissions';
import { driveUpdatePermission } from './lib/action/drive-update-permission';
import { driveRemovePermission } from './lib/action/drive-remove-permission';
import { driveListSharedDrives } from './lib/action/drive-list-shared-drives';
import { driveGetSharedDrive } from './lib/action/drive-get-shared-drive';
import { driveCreateSharedDrive } from './lib/action/drive-create-shared-drive';
import { driveUpdateSharedDrive } from './lib/action/drive-update-shared-drive';
import { driveDeleteSharedDrive } from './lib/action/drive-delete-shared-drive';
import { driveCreateComment } from './lib/action/drive-create-comment';
import { driveListComments } from './lib/action/drive-list-comments';
import { driveCreateReply } from './lib/action/drive-create-reply';
import { driveGetReply } from './lib/action/drive-get-reply';
import { driveListReplies } from './lib/action/drive-list-replies';
import { driveUpdateReply } from './lib/action/drive-update-reply';
import { driveDeleteReply } from './lib/action/drive-delete-reply';
import { driveGetAbout } from './lib/action/drive-get-about';

export { googleDriveAuth, getAccessToken, GoogleDriveAuthValue, createGoogleClient } from './lib/auth';

export const googleDrive = createPiece({
  minimumSupportedRelease: '0.5.6',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-drive.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  displayName: 'Google Drive',
  description: 'Cloud storage and file backup',
  authors: [
    'BastienMe',
    'ArmanGiau3',
    'Vitalini',
    'pfernandez98',
    'kanarelo',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'geekyme'
  ],
  triggers: [newFile, newFolder],
  actions: [
    googleDriveCreateNewFolder,
    googleDriveCreateNewTextFile,
    googleDriveUploadFile,
    readFile,
    googleDriveGetResourceById,
    googleDriveListFiles,
    googleDriveSearchFolder,
    duplicateFileAction,
    saveFileAsPdf,
    addPermission,
    deletePermission,
    setPublicAccess,
    moveFileAction,
    googleDriveDeleteFile,
    googleDriveTrashFile,
    // Phase-3 audience:'ai' agent atomics (full Composio-parity agent surface)
    driveCreateFolder,
    driveCreateFileFromText,
    driveUploadFile,
    driveUploadFromUrl,
    driveReplaceFileContent,
    driveDownloadFile,
    driveExportWorkspaceFile,
    driveGetFile,
    driveListFiles,
    driveSearchFiles,
    driveCopyFile,
    driveMoveFile,
    driveUpdateFileMetadata,
    driveSaveFileAsPdf,
    driveTrashFile,
    driveUntrashFile,
    driveDeleteFile,
    driveEmptyTrash,
    driveShareFile,
    driveSetPublicAccess,
    driveListPermissions,
    driveUpdatePermission,
    driveRemovePermission,
    driveListSharedDrives,
    driveGetSharedDrive,
    driveCreateSharedDrive,
    driveUpdateSharedDrive,
    driveDeleteSharedDrive,
    driveCreateComment,
    driveListComments,
    driveCreateReply,
    driveGetReply,
    driveListReplies,
    driveUpdateReply,
    driveDeleteReply,
    driveGetAbout,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.googleapis.com/drive/v3',
      auth: googleDriveAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await getAccessToken(auth as GoogleDriveAuthValue)}`,
      }),
    }),
  ],
  auth: googleDriveAuth,
});
