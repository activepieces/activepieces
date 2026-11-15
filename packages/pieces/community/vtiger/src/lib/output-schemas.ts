import { OutputSchema } from '@activepieces/pieces-framework';

const WS_ID = 'Vtiger webservice ID, for example 12x345.';
const RECORD_FIELDS = 'All fields of the record, keyed by field API name.';

export const originalRecordEnvelopeSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'result', label: 'Record', description: RECORD_FIELDS },
  ],
};

export const originalDeleteEnvelopeSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'result', label: 'Result', children: [{ key: 'status', label: 'Status' }] },
  ],
};

export const queryRecordsSchema: OutputSchema = {
  fields: [{ key: 'records', value: '', label: 'Rows', description: 'Each row holds the selected columns.' }],
  itemLabel: '{id}',
};

export const currentUserSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID', description: WS_ID },
    { key: 'user_name', label: 'Username' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email1', label: 'Email', format: 'email' },
    { key: 'userlabel', label: 'Display Name' },
    { key: 'user_type', label: 'User Type' },
    { key: 'status', label: 'Status' },
    { key: 'is_admin', label: 'Is Admin', description: 'on for administrators.' },
    { key: 'roleid', label: 'Role ID' },
    { key: 'time_zone', label: 'Time Zone' },
    { key: 'date_format', label: 'Date Format' },
    { key: 'hour_format', label: 'Hour Format' },
    { key: 'language', label: 'Language' },
  ],
};

export const listModulesSchema: OutputSchema = {
  fields: [
    {
      key: 'modules',
      label: 'Modules',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'API Name' },
        { key: 'label', label: 'Label' },
        { key: 'singular', label: 'Singular Label' },
        { key: 'isEntity', label: 'Is Entity', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const describeModuleSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Module' },
    { key: 'label', label: 'Label' },
    { key: 'idPrefix', label: 'ID Prefix' },
    { key: 'createable', label: 'Createable', format: 'boolean' },
    { key: 'updateable', label: 'Updateable', format: 'boolean' },
    { key: 'deleteable', label: 'Deleteable', format: 'boolean' },
    { key: 'labelFields', label: 'Label Fields' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'API Name' },
        { key: 'label', label: 'Label' },
        { key: 'type', label: 'Type' },
        { key: 'mandatory', label: 'Mandatory', format: 'boolean' },
        { key: 'editable', label: 'Editable', format: 'boolean' },
        { key: 'picklistValues', label: 'Picklist Values' },
        { key: 'refersTo', label: 'Refers To' },
      ],
    },
    { key: 'fieldCount', label: 'Field Count', format: 'number' },
  ],
};

export const aiRecordSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID', description: WS_ID },
    { key: 'record', label: 'Record', description: RECORD_FIELDS },
  ],
};

export const relationTypesSchema: OutputSchema = {
  fields: [
    {
      key: 'relations',
      label: 'Relations',
      labelKey: 'relationLabel',
      listItems: [
        { key: 'relationId', label: 'Relation ID' },
        { key: 'relatedModule', label: 'Related Module' },
        { key: 'relationLabel', label: 'Relation Label', description: 'Pass this as Relation Label.' },
        { key: 'translatedLabel', label: 'Display Label' },
        { key: 'actions', label: 'Allowed Actions', description: 'add and/or select.' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const recordTagsSchema: OutputSchema = {
  fields: [
    { key: 'recordId', label: 'Record ID', description: WS_ID },
    { key: 'tags', label: 'Tags' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const tagChangeSchema: OutputSchema = {
  fields: [
    { key: 'recordId', label: 'Record ID', description: WS_ID },
    { key: 'tags', label: 'Requested Tags' },
    { key: 'message', label: 'Vtiger Message' },
  ],
};

export const accountHierarchySchema: OutputSchema = {
  fields: [
    { key: 'accountId', label: 'Account ID', description: WS_ID },
    {
      key: 'hierarchy',
      label: 'Hierarchy',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Account ID', description: WS_ID },
        { key: 'name', label: 'Name' },
        { key: 'level', label: 'Level', format: 'number' },
        { key: 'label', label: 'Level Label', description: 'Org, Child Org, and so on.' },
        { key: 'current', label: 'Is Requested Account' },
      ],
    },
  ],
};

export const picklistDependencySchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'sourceField', label: 'Source Field' },
    { key: 'targetField', label: 'Target Field' },
    { key: 'hasDependency', label: 'Has Dependency', format: 'boolean' },
    {
      key: 'mappings',
      label: 'Mappings',
      labelKey: 'sourceValue',
      listItems: [
        { key: 'sourceValue', label: 'Source Value' },
        { key: 'targetValues', label: 'Allowed Target Values' },
      ],
    },
  ],
};

export const reopenRecordSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID', description: WS_ID },
    { key: 'reopened', label: 'Reopened', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};

export const changedRecordsSchema: OutputSchema = {
  fields: [
    { key: 'updatedIds', label: 'Created or Updated IDs' },
    { key: 'deletedIds', label: 'Deleted IDs' },
    { key: 'updatedCount', label: 'Updated Count', format: 'number' },
    { key: 'deletedCount', label: 'Deleted Count', format: 'number' },
    { key: 'more', label: 'More', format: 'boolean' },
    { key: 'lastModifiedTime', label: 'Last Modified Time', description: 'Unix seconds; pass as Modified Since to continue.' },
  ],
};

export const downloadAttachmentSchema: OutputSchema = {
  fields: [
    { key: 'attachmentId', label: 'Attachment ID' },
    { key: 'fileName', label: 'File Name' },
    { key: 'fileType', label: 'File Type' },
    { key: 'fileSize', label: 'File Size', format: 'filesize' },
    { key: 'file', label: 'File', format: 'url' },
  ],
};

export const recordListSchema: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records', description: RECORD_FIELDS },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const searchRecordListSchema: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records', description: RECORD_FIELDS },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const pagedRecordListSchema: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records', description: RECORD_FIELDS },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const deleteResultSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID', description: WS_ID },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const linkResultSchema: OutputSchema = {
  fields: [
    { key: 'sourceRecordId', label: 'Source Record ID', description: WS_ID },
    { key: 'relatedRecordId', label: 'Related Record ID', description: WS_ID },
    { key: 'relationLabel', label: 'Relation Label' },
    { key: 'linked', label: 'Linked', format: 'boolean' },
  ],
};

export const unlinkResultSchema: OutputSchema = {
  fields: [
    { key: 'sourceRecordId', label: 'Source Record ID', description: WS_ID },
    { key: 'relatedRecordId', label: 'Related Record ID', description: WS_ID },
    { key: 'unlinked', label: 'Unlinked', format: 'boolean' },
  ],
};

export const convertLeadSchema: OutputSchema = {
  fields: [
    { key: 'leadId', label: 'Lead ID', description: WS_ID },
    { key: 'contactId', label: 'Contact ID', description: WS_ID },
    { key: 'accountId', label: 'Organization ID', description: WS_ID },
    { key: 'potentialId', label: 'Deal ID', description: WS_ID },
  ],
};

export const findOrCreateSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created', format: 'boolean' },
    { key: 'matchCount', label: 'Match Count', format: 'number', description: 'Matches found (capped at 2).' },
    { key: 'id', label: 'Record ID', description: WS_ID },
    { key: 'record', label: 'Record', description: RECORD_FIELDS },
  ],
};
