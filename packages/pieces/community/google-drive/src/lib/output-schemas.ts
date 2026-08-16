import { OutputSchema } from '@activepieces/pieces-framework';

export const createNewGdriveFolderActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'Folder Name',
    },
    {
      key: 'id',
      label: 'Folder ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const createNewGdriveFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const uploadGdriveFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const readFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File URL',
      value: '',
      format: 'url',
    },
  ],
};

export const getFileOrFolderByIdActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const listFilesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'files',
      label: 'Files',
      labelKey: 'name',
      listItems: [
        {
          key: 'name',
          label: 'Name',
          value: 'name',
        },
        {
          key: 'id',
          label: 'File ID',
          value: 'id',
        },
        {
          key: 'mimeType',
          label: 'MIME Type',
          value: 'mimeType',
        },
        {
          key: 'trashed',
          label: 'Trashed',
          value: 'trashed',
          format: 'boolean',
        },
        {
          key: 'parents',
          label: 'Parent Folder ID',
          value: 'parents[0]',
        },
      ],
    },
    {
      key: 'incompleteSearch',
      label: 'Incomplete Search',
      value: 'incompleteSearch',
      format: 'boolean',
    },
  ],
};

export const searchFolderActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      value: '',
      labelKey: 'name',
      listItems: [
        {
          key: 'name',
          label: 'Name',
          value: 'name',
        },
        {
          key: 'mimeType',
          label: 'MIME Type',
          value: 'mimeType',
        },
        {
          key: 'id',
          label: 'File ID',
          value: 'id',
        },
        {
          key: 'createdTime',
          label: 'Created Time',
          value: 'createdTime',
          format: 'datetime',
        },
        {
          key: 'modifiedTime',
          label: 'Modified Time',
          value: 'modifiedTime',
          format: 'datetime',
        },
      ],
    },
  ],
};

export const duplicateFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const saveFileAsPdfActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const googleDriveMoveFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
    {
      key: 'webContentLink',
      label: 'Download Link',
      format: 'url',
    },
    {
      key: 'iconLink',
      label: 'Icon',
      format: 'image',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
    {
      key: 'fileExtension',
      label: 'File Extension',
    },
    {
      key: 'starred',
      label: 'Starred',
      format: 'boolean',
    },
    {
      key: 'trashed',
      label: 'Trashed',
      format: 'boolean',
    },
    {
      key: 'shared',
      label: 'Shared',
      format: 'boolean',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'parents',
      label: 'Parent Folder IDs',
    },
    {
      key: 'owners',
      label: 'Owners',
      labelKey: 'displayName',
      listItems: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'lastModifyingUser',
      label: 'Last Modifying User',
      children: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
      ],
    },
    {
      key: 'permissions',
      label: 'Permissions',
      labelKey: 'displayName',
      listItems: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'role',
          label: 'Role',
        },
        {
          key: 'type',
          label: 'Type',
        },
        {
          key: 'id',
          label: 'Permission ID',
        },
      ],
    },
  ],
};

export const setPublicAccessActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'type',
      label: 'Type',
    },
    {
      key: 'role',
      label: 'Role',
    },
    {
      key: 'id',
      label: 'Permission ID',
    },
    {
      key: 'allowFileDiscovery',
      label: 'Allow File Discovery',
      format: 'boolean',
    },
    {
      key: 'downloadUrl',
      label: 'Download URL',
      format: 'url',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const updatePermissionsActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'role',
            label: 'Role',
        },
        {
            key: 'type',
            label: 'Type',
        },
        {
            key: 'id',
            label: 'Permission ID',
        },
    ],
};

export const deletePermissionsActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'removed',
            label: 'Removed',
            value: 'removed',
            format: 'boolean',
        },
        {
            key: 'message',
            label: 'Message',
            value: 'message',
        },
    ],
};

export const trashGdriveFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const newFileTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'id',
      label: 'File ID',
    },
  ],
};

export const newFolderTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'Folder Name',
    },
    {
      key: 'id',
      label: 'Folder ID',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
  ],
};

const fileFieldsForGet: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'File ID',
  },
  {
    key: 'name',
    label: 'File Name',
  },
  {
    key: 'mimeType',
    label: 'MIME Type',
  },
  {
    key: 'size',
    label: 'Size',
    format: 'filesize',
  },
  {
    key: 'createdTime',
    label: 'Created Time',
    format: 'datetime',
  },
  {
    key: 'modifiedTime',
    label: 'Modified Time',
    format: 'datetime',
  },
  {
    key: 'webViewLink',
    label: 'View Link',
    format: 'url',
  },
  {
    key: 'webContentLink',
    label: 'Download Link',
    format: 'url',
  },
  {
    key: 'iconLink',
    label: 'Icon',
    format: 'image',
  },
  {
    key: 'fileExtension',
    label: 'File Extension',
  },
  {
    key: 'starred',
    label: 'Starred',
    format: 'boolean',
  },
  {
    key: 'trashed',
    label: 'Trashed',
    format: 'boolean',
  },
  {
    key: 'shared',
    label: 'Shared',
    format: 'boolean',
  },
  {
    key: 'parents',
    label: 'Parent Folder IDs',
  },
  {
    key: 'owners',
    label: 'Owners',
    labelKey: 'displayName',
    listItems: [
      {
        key: 'displayName',
        label: 'Name',
      },
      {
        key: 'emailAddress',
        label: 'Email',
        format: 'email',
      },
      {
        key: 'photoLink',
        label: 'Photo',
        format: 'image',
      },
      {
        key: 'me',
        label: 'Is Me',
        format: 'boolean',
      },
    ],
  },
  {
    key: 'lastModifyingUser',
    label: 'Last Modifying User',
    children: [
      {
        key: 'displayName',
        label: 'Name',
      },
      {
        key: 'emailAddress',
        label: 'Email',
        format: 'email',
      },
      {
        key: 'photoLink',
        label: 'Photo',
        format: 'image',
      },
    ],
  },
];

export const driveGetFileOutputSchema: OutputSchema = {
  fields: fileFieldsForGet,
};

export const driveListFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'files',
      label: 'Files',
      labelKey: 'name',
      listItems: [
        {
          key: 'id',
          label: 'File ID',
        },
        {
          key: 'name',
          label: 'File Name',
        },
        {
          key: 'mimeType',
          label: 'MIME Type',
        },
        {
          key: 'size',
          label: 'Size',
          format: 'filesize',
        },
        {
          key: 'createdTime',
          label: 'Created Time',
          format: 'datetime',
        },
        {
          key: 'modifiedTime',
          label: 'Modified Time',
          format: 'datetime',
        },
        {
          key: 'webViewLink',
          label: 'View Link',
          format: 'url',
        },
        {
          key: 'webContentLink',
          label: 'Download Link',
          format: 'url',
        },
        {
          key: 'fileExtension',
          label: 'File Extension',
        },
        {
          key: 'starred',
          label: 'Starred',
          format: 'boolean',
        },
        {
          key: 'trashed',
          label: 'Trashed',
          format: 'boolean',
        },
        {
          key: 'shared',
          label: 'Shared',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'incompleteSearch',
      label: 'Incomplete Search',
      format: 'boolean',
    },
  ],
};

export const driveSearchFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'files',
      label: 'Search Results',
      labelKey: 'name',
      listItems: [
        {
          key: 'id',
          label: 'File ID',
        },
        {
          key: 'name',
          label: 'File Name',
        },
        {
          key: 'mimeType',
          label: 'MIME Type',
        },
        {
          key: 'size',
          label: 'Size',
          format: 'filesize',
        },
        {
          key: 'createdTime',
          label: 'Created Time',
          format: 'datetime',
        },
        {
          key: 'modifiedTime',
          label: 'Modified Time',
          format: 'datetime',
        },
        {
          key: 'webViewLink',
          label: 'View Link',
          format: 'url',
        },
        {
          key: 'webContentLink',
          label: 'Download Link',
          format: 'url',
        },
        {
          key: 'fileExtension',
          label: 'File Extension',
        },
      ],
    },
  ],
};

export const driveCreateFileFromTextOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
    {
      key: 'webContentLink',
      label: 'Download Link',
      format: 'url',
    },
    {
      key: 'fileExtension',
      label: 'File Extension',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
    {
      key: 'parents',
      label: 'Parent Folder IDs',
    },
    {
      key: 'owners',
      label: 'Owners',
      labelKey: 'displayName',
      listItems: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'lastModifyingUser',
      label: 'Last Modifying User',
      children: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
      ],
    },
    {
      key: 'shared',
      label: 'Shared',
      format: 'boolean',
    },
  ],
};

export const driveUploadFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
    {
      key: 'webContentLink',
      label: 'Download Link',
      format: 'url',
    },
    {
      key: 'iconLink',
      label: 'Icon',
      format: 'image',
    },
    {
      key: 'fileExtension',
      label: 'File Extension',
    },
    {
      key: 'parents',
      label: 'Parent Folder IDs',
    },
    {
      key: 'owners',
      label: 'Owners',
      labelKey: 'displayName',
      listItems: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveCopyFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
    {
      key: 'webContentLink',
      label: 'Download Link',
      format: 'url',
    },
    {
      key: 'fileExtension',
      label: 'File Extension',
    },
    {
      key: 'parents',
      label: 'Parent Folder IDs',
    },
    {
      key: 'owners',
      label: 'Owners',
      labelKey: 'displayName',
      listItems: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveMoveFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
    {
      key: 'webContentLink',
      label: 'Download Link',
      format: 'url',
    },
    {
      key: 'fileExtension',
      label: 'File Extension',
    },
    {
      key: 'parents',
      label: 'Parent Folder IDs',
    },
    {
      key: 'shared',
      label: 'Shared',
      format: 'boolean',
    },
    {
      key: 'owners',
      label: 'Owners',
      labelKey: 'displayName',
      listItems: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveUpdateFileMetadataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'description',
      label: 'Description',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'starred',
      label: 'Starred',
      format: 'boolean',
    },
    {
      key: 'trashed',
      label: 'Trashed',
      format: 'boolean',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
  ],
};

export const driveShareFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Permission ID',
    },
    {
      key: 'type',
      label: 'Type',
    },
    {
      key: 'role',
      label: 'Role',
    },
    {
      key: 'emailAddress',
      label: 'Email Address',
      format: 'email',
    },
    {
      key: 'displayName',
      label: 'Display Name',
    },
    {
      key: 'photoLink',
      label: 'Photo',
      format: 'image',
    },
    {
      key: 'pendingOwner',
      label: 'Pending Owner',
      format: 'boolean',
    },
    {
      key: 'deleted',
      label: 'Deleted',
      format: 'boolean',
    },
    {
      key: 'permissionDetails',
      label: 'Permission Details',
      labelKey: 'role',
      listItems: [
        {
          key: 'role',
          label: 'Role',
        },
        {
          key: 'permissionType',
          label: 'Permission Type',
        },
        {
          key: 'inherited',
          label: 'Inherited',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveListPermissionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'permissions',
      label: 'Permissions',
      labelKey: 'displayName',
      listItems: [
        {
          key: 'id',
          label: 'Permission ID',
        },
        {
          key: 'type',
          label: 'Type',
        },
        {
          key: 'role',
          label: 'Role',
        },
        {
          key: 'emailAddress',
          label: 'Email Address',
          format: 'email',
        },
        {
          key: 'displayName',
          label: 'Display Name',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'deleted',
          label: 'Deleted',
          format: 'boolean',
        },
        {
          key: 'pendingOwner',
          label: 'Pending Owner',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveSetPublicAccessOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Permission ID',
    },
    {
      key: 'type',
      label: 'Type',
    },
    {
      key: 'role',
      label: 'Role',
    },
    {
      key: 'allowFileDiscovery',
      label: 'Allow File Discovery',
      format: 'boolean',
    },
    {
      key: 'permissionDetails',
      label: 'Permission Details',
      labelKey: 'role',
      listItems: [
        {
          key: 'role',
          label: 'Role',
        },
        {
          key: 'permissionType',
          label: 'Permission Type',
        },
        {
          key: 'inherited',
          label: 'Inherited',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveUpdatePermissionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Permission ID',
    },
    {
      key: 'type',
      label: 'Type',
    },
    {
      key: 'role',
      label: 'Role',
    },
    {
      key: 'emailAddress',
      label: 'Email Address',
      format: 'email',
    },
    {
      key: 'displayName',
      label: 'Display Name',
    },
    {
      key: 'photoLink',
      label: 'Photo',
      format: 'image',
    },
  ],
};

export const driveTrashFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'trashed',
      label: 'Trashed',
      format: 'boolean',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
  ],
};

export const driveUntrashFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'trashed',
      label: 'Trashed',
      format: 'boolean',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
  ],
};

export const driveReplaceFileContentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
  ],
};

export const driveGetAboutOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'user',
      label: 'Current User',
      children: [
        {
          key: 'displayName',
          label: 'Display Name',
        },
        {
          key: 'emailAddress',
          label: 'Email Address',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
        {
          key: 'permissionId',
          label: 'Permission ID',
        },
      ],
    },
    {
      key: 'storageQuota',
      label: 'Storage Quota',
      children: [
        {
          key: 'limit',
          label: 'Total Limit',
          format: 'filesize',
        },
        {
          key: 'usage',
          label: 'Used Space',
          format: 'filesize',
        },
        {
          key: 'usageInDrive',
          label: 'Used in Drive',
          format: 'filesize',
        },
        {
          key: 'usageInDriveTrash',
          label: 'Used in Trash',
          format: 'filesize',
        },
      ],
    },
    {
      key: 'maxUploadSize',
      label: 'Max Upload Size',
      format: 'filesize',
    },
  ],
};

export const driveListSharedDrivesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'drives',
      label: 'Shared Drives',
      labelKey: 'name',
      listItems: [
        {
          key: 'id',
          label: 'Drive ID',
        },
        {
          key: 'name',
          label: 'Drive Name',
        },
        {
          key: 'kind',
          label: 'Kind',
        },
        {
          key: 'colorRgb',
          label: 'Color',
        },
        {
          key: 'createdTime',
          label: 'Created Time',
          format: 'datetime',
        },
      ],
    },
  ],
};

export const driveGetSharedDriveOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Drive ID',
    },
    {
      key: 'name',
      label: 'Drive Name',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
    {
      key: 'colorRgb',
      label: 'Color',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'restrictions',
      label: 'Restrictions',
      children: [
        {
          key: 'adminManagedRestrictions',
          label: 'Admin Managed',
          format: 'boolean',
        },
        {
          key: 'copyRequiresWriterPermission',
          label: 'Copy Requires Writer Permission',
          format: 'boolean',
        },
        {
          key: 'domainUsersOnly',
          label: 'Domain Users Only',
          format: 'boolean',
        },
        {
          key: 'driveMembersOnly',
          label: 'Drive Members Only',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveListCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'content',
      listItems: [
        {
          key: 'id',
          label: 'Comment ID',
        },
        {
          key: 'content',
          label: 'Content',
        },
        {
          key: 'createdTime',
          label: 'Created Time',
          format: 'datetime',
        },
        {
          key: 'modifiedTime',
          label: 'Modified Time',
          format: 'datetime',
        },
        {
          key: 'author',
          label: 'Author',
          children: [
            {
              key: 'displayName',
              label: 'Name',
            },
            {
              key: 'emailAddress',
              label: 'Email',
              format: 'email',
            },
            {
              key: 'photoLink',
              label: 'Photo',
              format: 'image',
            },
          ],
        },
      ],
    },
  ],
};

export const driveCreateReplyOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Reply ID',
    },
    {
      key: 'content',
      label: 'Content',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'author',
      label: 'Author',
      children: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveCreateCommentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Comment ID',
    },
    {
      key: 'content',
      label: 'Content',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'author',
      label: 'Author',
      children: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveGetReplyOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Reply ID',
    },
    {
      key: 'content',
      label: 'Content',
    },
    {
      key: 'htmlContent',
      label: 'HTML Content',
      format: 'html',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'deleted',
      label: 'Deleted',
      format: 'boolean',
    },
    {
      key: 'author',
      label: 'Author',
      children: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveListRepliesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'replies',
      label: 'Replies',
      labelKey: 'content',
      listItems: [
        {
          key: 'id',
          label: 'Reply ID',
        },
        {
          key: 'content',
          label: 'Content',
        },
        {
          key: 'createdTime',
          label: 'Created Time',
          format: 'datetime',
        },
        {
          key: 'modifiedTime',
          label: 'Modified Time',
          format: 'datetime',
        },
        {
          key: 'deleted',
          label: 'Deleted',
          format: 'boolean',
        },
        {
          key: 'author',
          label: 'Author',
          children: [
            {
              key: 'displayName',
              label: 'Name',
            },
            {
              key: 'emailAddress',
              label: 'Email',
              format: 'email',
            },
            {
              key: 'photoLink',
              label: 'Photo',
              format: 'image',
            },
          ],
        },
      ],
    },
  ],
};

export const driveUpdateReplyOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Reply ID',
    },
    {
      key: 'content',
      label: 'Content',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'deleted',
      label: 'Deleted',
      format: 'boolean',
    },
    {
      key: 'author',
      label: 'Author',
      children: [
        {
          key: 'displayName',
          label: 'Name',
        },
        {
          key: 'emailAddress',
          label: 'Email',
          format: 'email',
        },
        {
          key: 'photoLink',
          label: 'Photo',
          format: 'image',
        },
        {
          key: 'me',
          label: 'Is Me',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const driveSaveFileAsPdfOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'size',
      label: 'Size',
      format: 'filesize',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'modifiedTime',
      label: 'Modified Time',
      format: 'datetime',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
  ],
};

export const driveCreateFolderOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Folder ID',
    },
    {
      key: 'name',
      label: 'Folder Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'parents',
      label: 'Parent Folder IDs',
    },
    {
      key: 'webViewLink',
      label: 'View Link',
      format: 'url',
    },
  ],
};

export const driveCreateSharedDriveOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Drive ID',
    },
    {
      key: 'name',
      label: 'Drive Name',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
    {
      key: 'colorRgb',
      label: 'Color',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
  ],
};

export const driveUpdateSharedDriveOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Drive ID',
    },
    {
      key: 'name',
      label: 'Drive Name',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
    {
      key: 'colorRgb',
      label: 'Color',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      format: 'datetime',
    },
  ],
};

export const driveUploadFromUrlOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'File ID',
    },
    {
      key: 'name',
      label: 'File Name',
    },
    {
      key: 'mimeType',
      label: 'MIME Type',
    },
    {
      key: 'kind',
      label: 'Kind',
    },
  ],
};

export const driveDownloadFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File URL',
      value: '',
      format: 'url',
    },
  ],
};

export const driveExportWorkspaceFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File URL',
      value: '',
      format: 'url',
    },
  ],
};

export const driveDeleteReplyOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      format: 'boolean',
    },
    {
      key: 'reply_id',
      label: 'Reply ID',
    },
  ],
};

export const driveDeleteSharedDriveOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'deleted',
      label: 'Deleted',
      format: 'boolean',
    },
    {
      key: 'driveId',
      label: 'Drive ID',
    },
  ],
};

export const driveEmptyTrashOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      format: 'boolean',
    },
    {
      key: 'driveId',
      label: 'Drive ID',
    },
  ],
};

export const driveRemovePermissionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'removed',
      label: 'Removed',
      format: 'boolean',
    },
    {
      key: 'message',
      label: 'Message',
    },
  ],
};
