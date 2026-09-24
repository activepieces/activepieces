import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { copyFile } from './lib/actions/copy-file';
import { downloadFile } from './lib/actions/download-file';
import { listFiles } from './lib/actions/list-files';
import { listFolders } from './lib/actions/list-folders';
import { uploadFile } from './lib/actions/upload-file';
import { oneDriveAuth } from './lib/auth';
import { oneDriveCommon } from './lib/common/common';
import { getCloudProp } from './lib/common/microsoft-cloud';
import { newFile } from './lib/triggers/new-file';
import { onedriveAddItemToBundle } from './lib/actions/onedrive-add-item-to-bundle';
import { onedriveCheckinItem } from './lib/actions/onedrive-checkin-item';
import { onedriveCheckoutItem } from './lib/actions/onedrive-checkout-item';
import { onedriveCopyItem } from './lib/actions/onedrive-copy-item';
import { onedriveCreateBundle } from './lib/actions/onedrive-create-bundle';
import { onedriveCreateFolder } from './lib/actions/onedrive-create-folder';
import { onedriveCreateSharingLink } from './lib/actions/onedrive-create-sharing-link';
import { onedriveCreateTextFile } from './lib/actions/onedrive-create-text-file';
import { onedriveDeleteItemPermission } from './lib/actions/onedrive-delete-item-permission';
import { onedriveDeleteItem } from './lib/actions/onedrive-delete-item';
import { onedriveDiscardCheckout } from './lib/actions/onedrive-discard-checkout';
import { onedriveDownloadFileAsFormat } from './lib/actions/onedrive-download-file-as-format';
import { onedriveDownloadFile } from './lib/actions/onedrive-download-file';
import { onedriveDownloadItemVersion } from './lib/actions/onedrive-download-item-version';
import { onedriveGetCopyStatus } from './lib/actions/onedrive-get-copy-status';
import { onedriveGetDrive } from './lib/actions/onedrive-get-drive';
import { onedriveGetItem } from './lib/actions/onedrive-get-item';
import { onedriveGetSpecialFolder } from './lib/actions/onedrive-get-special-folder';
import { onedriveInviteToItem } from './lib/actions/onedrive-invite-to-item';
import { onedriveListBundles } from './lib/actions/onedrive-list-bundles';
import { onedriveListDriveChanges } from './lib/actions/onedrive-list-drive-changes';
import { onedriveListDrives } from './lib/actions/onedrive-list-drives';
import { onedriveListFolderChildren } from './lib/actions/onedrive-list-folder-children';
import { onedriveListItemPermissions } from './lib/actions/onedrive-list-item-permissions';
import { onedriveListItemThumbnails } from './lib/actions/onedrive-list-item-thumbnails';
import { onedriveListItemVersions } from './lib/actions/onedrive-list-item-versions';
import { onedriveMoveItem } from './lib/actions/onedrive-move-item';
import { onedriveRemoveItemFromBundle } from './lib/actions/onedrive-remove-item-from-bundle';
import { onedriveReplaceFileContent } from './lib/actions/onedrive-replace-file-content';
import { onedriveResolveSharingLink } from './lib/actions/onedrive-resolve-sharing-link';
import { onedriveRestoreItemVersion } from './lib/actions/onedrive-restore-item-version';
import { onedriveSearchItems } from './lib/actions/onedrive-search-items';
import { onedriveUpdateItemPermission } from './lib/actions/onedrive-update-item-permission';
import { onedriveUpdateItem } from './lib/actions/onedrive-update-item';
import { onedriveUploadFile } from './lib/actions/onedrive-upload-file';

export const microsoftOneDrive = createPiece({
  displayName: 'Microsoft OneDrive',
  description: 'Cloud storage by Microsoft',
  auth: oneDriveAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/oneDrive.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['BastienMe', 'kishanprmr', 'MoShizzle', 'abuaboud', 'ikus060'],
  actions: [
    uploadFile,
    downloadFile,
    copyFile,
    listFiles,
    listFolders,
    onedriveAddItemToBundle,
    onedriveCheckinItem,
    onedriveCheckoutItem,
    onedriveCopyItem,
    onedriveCreateBundle,
    onedriveCreateFolder,
    onedriveCreateSharingLink,
    onedriveCreateTextFile,
    onedriveDeleteItemPermission,
    onedriveDeleteItem,
    onedriveDiscardCheckout,
    onedriveDownloadFileAsFormat,
    onedriveDownloadFile,
    onedriveDownloadItemVersion,
    onedriveGetCopyStatus,
    onedriveGetDrive,
    onedriveGetItem,
    onedriveGetSpecialFolder,
    onedriveInviteToItem,
    onedriveListBundles,
    onedriveListDriveChanges,
    onedriveListDrives,
    onedriveListFolderChildren,
    onedriveListItemPermissions,
    onedriveListItemThumbnails,
    onedriveListItemVersions,
    onedriveMoveItem,
    onedriveRemoveItemFromBundle,
    onedriveReplaceFileContent,
    onedriveResolveSharingLink,
    onedriveRestoreItemVersion,
    onedriveSearchItems,
    onedriveUpdateItemPermission,
    onedriveUpdateItem,
    onedriveUploadFile,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return oneDriveCommon.getBaseUrl(getCloudProp(auth));
      },
      auth: oneDriveAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [newFile],
});
