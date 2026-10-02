import { OutputSchema } from '@activepieces/pieces-framework';

export const gristAddColumnsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'ID' }],
    },
  ],
};

export const gristAddRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'record_ids', label: 'Record IDs' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristDownloadAttachmentsArchiveOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'file_name', label: 'File Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
  ],
};

export const gristCreateDocumentOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'ID' }],
};

export const gristCreateTableOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'ID' }],
    },
  ],
};

export const gristDeleteColumnOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const gristDeleteRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'deleted_count', label: 'Deleted Count', format: 'number' },
  ],
};

export const gristGetDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'access', label: 'Access' },
    { key: 'isPinned', label: 'Is Pinned', format: 'boolean' },
    { key: 'urlId', label: 'URL ID' },
    { key: 'type', label: 'Type' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
    {
      key: 'workspace',
      label: 'Workspace',
      children: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'access', label: 'Access' },
        {
          key: 'org',
          label: 'Organization',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'name', label: 'Name' },
            { key: 'domain', label: 'Domain' },
          ],
        },
      ],
    },
  ],
};

export const gristListAttachmentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'attachments',
      label: 'Attachments',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        {
          key: 'fields',
          label: 'Fields',
          children: [
            { key: 'fileName', label: 'File Name' },
            { key: 'fileSize', label: 'File Size', format: 'filesize' },
            { key: 'timeUploaded', label: 'Time Uploaded', format: 'datetime' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristListColumnsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Column ID' },
        {
          key: 'fields',
          label: 'Fields',
          children: [
            { key: 'label', label: 'Label' },
            { key: 'type', label: 'Type' },
            { key: 'isFormula', label: 'Is Formula', format: 'boolean' },
            { key: 'formula', label: 'Formula' },
            { key: 'widgetOptions', label: 'Widget Options' },
            { key: 'description', label: 'Description' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristListRecordsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'records',
      label: 'Records',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Row ID', format: 'number' },
        { key: 'fields', label: 'Fields', dynamicKey: true },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristListTablesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Table ID' },
        {
          key: 'fields',
          label: 'Fields',
          children: [
            { key: 'onDemand', label: 'On Demand', format: 'boolean' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristGetOrgAccessOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'users',
      label: 'Users',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'name', label: 'Name' },
        { key: 'picture', label: 'Picture', format: 'url' },
        { key: 'ref', label: 'Ref' },
        { key: 'access', label: 'Access' },
        { key: 'isMember', label: 'Is Member', format: 'boolean' },
      ],
    },
  ],
};

export const gristListOrganizationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'domain', label: 'Domain' },
        { key: 'access', label: 'Access' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristRunSqlQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristNewRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Row ID', format: 'number' },
    { key: 'manualSort', label: 'Manual Sort', format: 'number' },
  ],
};

export const gristUpdateColumnsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'updated_count', label: 'Updated Count', format: 'number' },
  ],
};

export const gristUploadAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    {
      key: 'fields',
      label: 'Fields',
      children: [
        { key: 'fileName', label: 'File Name' },
        { key: 'fileSize', label: 'File Size', format: 'filesize' },
        { key: 'timeUploaded', label: 'Time Uploaded', format: 'datetime' },
      ],
    },
  ],
};

export const gristListWorkspacesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'workspaces',
      label: 'Workspaces',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'access', label: 'Access' },
        { key: 'orgDomain', label: 'Org Domain' },
        { key: 'docs', label: 'Documents', labelKey: 'name' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const gristCreateRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Row ID', format: 'number' },
    { key: 'fields', label: 'Fields', dynamicKey: true },
  ],
};

export const gristSearchRecordOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'records',
      label: 'Records',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Row ID', format: 'number' },
        { key: 'fields', label: 'Fields', dynamicKey: true },
      ],
    },
  ],
};

export const gristUpdateRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Row ID', format: 'number' },
    { key: 'fields', label: 'Updated Fields', dynamicKey: true },
  ],
};
