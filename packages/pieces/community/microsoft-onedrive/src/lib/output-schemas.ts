import { OutputSchema } from '@activepieces/pieces-framework';

export const uploadFileOutputSchema: OutputSchema = {
  fields: driveFileFields(),
};

export const getFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'File ID' },
    { key: 'name', label: 'Name' },
    { key: 'data', label: 'File', format: 'url' },
    { key: 'mimeType', label: 'MIME Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
    { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
    { key: 'folderPath', label: 'Folder Path' },
    { key: 'driveId', label: 'Drive ID' },
  ],
};

export const copyFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'file', label: 'Copied File', children: driveFileFields() },
  ],
};

export const listFilesOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'files', label: 'Files', value: '', listItems: driveFileFields() }],
};

export const listFoldersOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'folders', label: 'Folders', value: '', listItems: driveFolderFields() }],
};

export const newFileTriggerOutputSchema: OutputSchema = {
  fields: driveFileFields(),
};

export const onedriveItemOutputSchema: OutputSchema = {
  fields: itemFields(),
};

export const onedriveCreateFolderOutputSchema: OutputSchema = {
  fields: [{ key: 'created', label: 'Created', format: 'boolean' }, ...itemFields()],
};

export const onedriveDownloadFileOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'File', format: 'url' }, ...itemFields()],
};

export const onedriveDownloadFileAsFormatOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Converted File', format: 'url' },
    { key: 'convertedFormat', label: 'Converted Format' },
    { key: 'convertedFileName', label: 'Converted File Name' },
    ...itemFields(),
  ],
};

export const onedriveDownloadItemVersionOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'File', format: 'url' },
    { key: 'itemId', label: 'Item ID' },
    { key: 'name', label: 'Name' },
    { key: 'versionId', label: 'Version ID' },
    { key: 'mimeType', label: 'MIME Type' },
  ],
};

export const onedriveResolveSharingLinkOutputSchema: OutputSchema = {
  fields: [{ key: 'shareId', label: 'Share ID' }, ...itemFields()],
};

export const onedriveBundleOutputSchema: OutputSchema = {
  fields: bundleFields(),
};

export const onedriveListItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Items', labelKey: 'name', listItems: itemFields() },
    ...pageFields(),
  ],
};

export const onedriveListDriveChangesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Changed Items', labelKey: 'name', listItems: itemFields() },
    ...pageFields(),
    { key: 'deltaToken', label: 'Delta Token' },
  ],
};

export const onedriveListBundlesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Bundles', labelKey: 'name', listItems: bundleFields() },
    ...pageFields(),
  ],
};

export const onedriveGetDriveOutputSchema: OutputSchema = {
  fields: [
    ...driveFields(),
    { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
    { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
    { key: 'quotaDeleted', label: 'Recycle Bin Size', format: 'filesize' },
  ],
};

export const onedriveListDrivesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Drives', labelKey: 'name', listItems: driveFields() },
    ...pageFields(),
  ],
};

export const onedriveListItemThumbnailsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Thumbnail Sets',
      labelKey: 'thumbnailSetId',
      listItems: [
        { key: 'thumbnailSetId', label: 'Thumbnail Set ID' },
        { key: 'smallUrl', label: 'Small', format: 'image' },
        { key: 'smallWidth', label: 'Small Width', format: 'number' },
        { key: 'smallHeight', label: 'Small Height', format: 'number' },
        { key: 'mediumUrl', label: 'Medium', format: 'image' },
        { key: 'mediumWidth', label: 'Medium Width', format: 'number' },
        { key: 'mediumHeight', label: 'Medium Height', format: 'number' },
        { key: 'largeUrl', label: 'Large', format: 'image' },
        { key: 'largeWidth', label: 'Large Width', format: 'number' },
        { key: 'largeHeight', label: 'Large Height', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const onedriveListItemVersionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Versions',
      labelKey: 'versionId',
      listItems: [
        { key: 'versionId', label: 'Version ID' },
        { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'lastModifiedByName', label: 'Last Modified By' },
        { key: 'lastModifiedByEmail', label: 'Last Modified By Email', format: 'email' },
      ],
    },
    ...pageFields(),
  ],
};

export const onedrivePermissionOutputSchema: OutputSchema = {
  fields: permissionFields(),
};

export const onedriveListItemPermissionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Permissions', labelKey: 'id', listItems: permissionFields() },
    ...pageFields(),
  ],
};

export const onedriveInviteToItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'permissions', label: 'Permissions', labelKey: 'grantedToEmail', listItems: permissionFields() },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'invitationSent', label: 'Invitation Sent', format: 'boolean' },
  ],
};

export const onedriveCopyItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'monitorUrl', label: 'Monitor URL', format: 'url' },
  ],
};

export const onedriveGetCopyStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'percentageComplete', label: 'Percentage Complete', format: 'number' },
    { key: 'resourceId', label: 'Copied Item ID' },
    { key: 'errorCode', label: 'Error Code' },
    { key: 'errorMessage', label: 'Error Message' },
  ],
};

export const onedriveItemActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'itemId', label: 'Item ID' },
    { key: 'path', label: 'Path' },
  ],
};

export const onedriveDeletePermissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'itemId', label: 'Item ID' },
    { key: 'permissionId', label: 'Permission ID' },
  ],
};

export const onedriveRestoreItemVersionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'itemId', label: 'Item ID' },
    { key: 'versionId', label: 'Restored Version ID' },
  ],
};

export const onedriveBundleMembershipOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'bundleId', label: 'Bundle ID' },
    { key: 'itemId', label: 'Item ID' },
  ],
};

function identityFields(): OutputSchema['fields'] {
  return [
    {
      key: 'user',
      label: 'User',
      children: [
        { key: 'displayName', label: 'Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'id', label: 'User ID' },
      ],
    },
  ];
}

function parentReferenceFields(): OutputSchema['fields'] {
  return [
    { key: 'id', label: 'Folder ID' },
    { key: 'name', label: 'Folder Name' },
    { key: 'path', label: 'Folder Path' },
    { key: 'driveId', label: 'Drive ID' },
    { key: 'driveType', label: 'Drive Type' },
  ];
}

function driveItemBaseFields(): OutputSchema['fields'] {
  return [
    { key: 'id', label: 'Item ID' },
    { key: 'name', label: 'Name' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
    { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
    { key: 'createdBy', label: 'Created By', children: identityFields() },
    { key: 'lastModifiedBy', label: 'Last Modified By', children: identityFields() },
    { key: 'parentReference', label: 'Parent Folder', children: parentReferenceFields() },
  ];
}

function driveFileFields(): OutputSchema['fields'] {
  return [
    ...driveItemBaseFields(),
    {
      key: 'file',
      label: 'File',
      children: [{ key: 'mimeType', label: 'MIME Type' }],
    },
  ];
}

function driveFolderFields(): OutputSchema['fields'] {
  return [
    ...driveItemBaseFields(),
    {
      key: 'folder',
      label: 'Folder',
      children: [{ key: 'childCount', label: 'Child Count', format: 'number' }],
    },
  ];
}

function itemFields(): OutputSchema['fields'] {
  return [
    { key: 'id', label: 'Item ID' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'mimeType', label: 'MIME Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'childCount', label: 'Child Count', format: 'number' },
    { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
    { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
    { key: 'parentId', label: 'Parent Folder ID' },
    { key: 'parentPath', label: 'Parent Folder Path' },
    { key: 'driveId', label: 'Drive ID' },
    { key: 'driveType', label: 'Drive Type' },
    { key: 'createdByName', label: 'Created By' },
    { key: 'createdByEmail', label: 'Created By Email', format: 'email' },
    { key: 'lastModifiedByName', label: 'Last Modified By' },
    { key: 'lastModifiedByEmail', label: 'Last Modified By Email', format: 'email' },
    { key: 'description', label: 'Description' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'remoteItemId', label: 'Remote Item ID' },
    { key: 'remoteDriveId', label: 'Remote Drive ID' },
  ];
}

function bundleFields(): OutputSchema['fields'] {
  return [
    ...itemFields(),
    { key: 'bundleChildCount', label: 'Items in Bundle', format: 'number' },
    { key: 'isAlbum', label: 'Is Album', format: 'boolean' },
  ];
}

function pageFields(): OutputSchema['fields'] {
  return [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextPageToken', label: 'Next Page Token' },
  ];
}

function driveFields(): OutputSchema['fields'] {
  return [
    { key: 'id', label: 'Drive ID' },
    { key: 'name', label: 'Name' },
    { key: 'driveType', label: 'Drive Type' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'ownerName', label: 'Owner' },
    { key: 'ownerEmail', label: 'Owner Email', format: 'email' },
    { key: 'quotaTotal', label: 'Total Storage', format: 'filesize' },
    { key: 'quotaUsed', label: 'Used Storage', format: 'filesize' },
    { key: 'quotaRemaining', label: 'Remaining Storage', format: 'filesize' },
    { key: 'quotaState', label: 'Storage State' },
  ];
}

function permissionFields(): OutputSchema['fields'] {
  return [
    { key: 'id', label: 'Permission ID' },
    { key: 'roles', label: 'Roles' },
    { key: 'linkType', label: 'Link Type' },
    { key: 'linkScope', label: 'Link Scope' },
    { key: 'linkWebUrl', label: 'Link URL', format: 'url' },
    { key: 'linkPreventsDownload', label: 'Link Prevents Download', format: 'boolean' },
    { key: 'grantedToName', label: 'Granted To' },
    { key: 'grantedToEmail', label: 'Granted To Email', format: 'email' },
    { key: 'grantedToId', label: 'Granted To ID' },
    { key: 'grantedToIdentities', label: 'Granted To (Link Users)' },
    { key: 'invitationEmail', label: 'Invitation Email', format: 'email' },
    { key: 'inherited', label: 'Inherited', format: 'boolean' },
    { key: 'inheritedFromId', label: 'Inherited From Folder ID' },
    { key: 'inheritedFromPath', label: 'Inherited From Path' },
    { key: 'hasPassword', label: 'Has Password', format: 'boolean' },
    { key: 'expirationDateTime', label: 'Expires At', format: 'datetime' },
    { key: 'shareId', label: 'Share ID' },
  ];
}
