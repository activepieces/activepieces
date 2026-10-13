import { OutputSchema } from '@activepieces/pieces-framework';

const errorFields: OutputSchema['fields'] = [
  {
    key: 'status',
    label: 'Status',
    description:
      'Either "success" or "error". These actions report a failure here instead of failing the step, so check it before relying on the result.',
  },
  {
    key: 'error',
    label: 'Error',
    description: 'Only present when Status is "error".',
    children: [
      {
        key: 'code',
        label: 'Error Code',
        description:
          'On SFTP, the numeric SFTP status code (2 = no such file, 3 = permission denied) or a Node error code such as ERR_BAD_PATH.',
      },
      {
        key: 'error',
        label: 'Error Detail',
        description: 'Only populated on FTP and FTPS.',
      },
    ],
  },
];

const directoryEntryFields: OutputSchema['fields'] = [
  {
    key: 'name',
    label: 'Name',
    description: 'File or folder name, without the directory path.',
  },
  {
    key: 'type',
    label: 'Type',
    description: '"-" for a file and "d" for a folder.',
  },
  {
    key: 'size',
    label: 'Size',
    format: 'filesize',
  },
  {
    key: 'modifyTime',
    label: 'Modified Time',
    description:
      'Unix timestamp in milliseconds. Populated on SFTP only; FTP and FTPS servers leave this empty.',
  },
  {
    key: 'accessTime',
    label: 'Accessed Time',
    description:
      'Unix timestamp in milliseconds. Populated on SFTP only; FTP and FTPS servers leave this empty.',
  },
  {
    key: 'rights',
    label: 'Permissions',
    children: [
      { key: 'user', label: 'Owner' },
      { key: 'group', label: 'Group' },
      { key: 'other', label: 'Other' },
    ],
  },
  {
    key: 'owner',
    label: 'Owner ID',
  },
  {
    key: 'group',
    label: 'Group ID',
  },
];

const watchedFileFields: OutputSchema['fields'] = [
  {
    key: 'path',
    label: 'Path',
    description: 'Full path of the file, built from the watched directory and the file name.',
  },
  {
    key: 'name',
    label: 'Name',
    description: 'File or folder name, without the directory path.',
  },
  {
    key: 'size',
    label: 'Size',
    format: 'filesize',
  },
  {
    key: 'type',
    label: 'Type',
    description:
      'On SFTP, "-" for a file and "d" for a folder. On FTP and FTPS, a number: 1 = file, 2 = folder, 3 = symbolic link.',
  },
  {
    key: 'modifyTime',
    label: 'Modified Time',
    description:
      'Unix timestamp in milliseconds, SFTP only. On FTP and FTPS use Raw Modified Time instead.',
  },
  {
    key: 'accessTime',
    label: 'Accessed Time',
    description: 'Unix timestamp in milliseconds, SFTP only.',
  },
  {
    key: 'rawModifiedAt',
    label: 'Raw Modified Time',
    description:
      'FTP and FTPS only, as reported by the server without parsing, for example "Sep 07 09:25".',
  },
  {
    key: 'rights',
    label: 'Permissions',
    description: 'SFTP only.',
    children: [
      { key: 'user', label: 'Owner' },
      { key: 'group', label: 'Group' },
      { key: 'other', label: 'Other' },
    ],
  },
  {
    key: 'permissions',
    label: 'Unix Permissions',
    description: 'FTP and FTPS only, as octal digits.',
    children: [
      { key: 'user', label: 'Owner', format: 'number' },
      { key: 'group', label: 'Group', format: 'number' },
      { key: 'world', label: 'Other', format: 'number' },
    ],
  },
  {
    key: 'owner',
    label: 'Owner ID',
    description: 'SFTP only. On FTP and FTPS use Owner Name instead.',
  },
  {
    key: 'user',
    label: 'Owner Name',
    description: 'FTP and FTPS only.',
  },
  {
    key: 'group',
    label: 'Group',
    description: 'Numeric group ID on SFTP, group name on FTP and FTPS.',
  },
];

export const createFileActionOutputSchema: OutputSchema = { fields: errorFields };

export const uploadFileActionOutputSchema: OutputSchema = { fields: errorFields };

export const deleteFileActionOutputSchema: OutputSchema = { fields: errorFields };

export const createFolderActionOutputSchema: OutputSchema = { fields: errorFields };

export const deleteFolderActionOutputSchema: OutputSchema = { fields: errorFields };

export const renameFileOrFolderActionOutputSchema: OutputSchema = { fields: errorFields };

export const readFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File',
      format: 'url',
      description: 'The downloaded file, ready to pass to a later step. Absent when Status is "error".',
    },
    ...errorFields,
  ],
};

export const listFolderContentsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contents',
      label: 'Contents',
      labelKey: 'name',
      description: 'Immediate entries of the directory, including hidden dotfiles. Not recursive.',
      listItems: directoryEntryFields,
    },
    ...errorFields,
  ],
};

export const newOrModifiedFileTriggerOutputSchema: OutputSchema = {
  fields: watchedFileFields,
};
