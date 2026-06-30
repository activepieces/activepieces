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
