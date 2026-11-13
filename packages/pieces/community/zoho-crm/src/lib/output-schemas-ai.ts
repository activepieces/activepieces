import { OutputSchema } from '@activepieces/pieces-framework';
import { childChangeOutputSchema, childWriteOutputSchema, recordWriteOutputSchema } from './output-schemas';

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status' },
  { key: 'role_id', label: 'Role ID' },
  { key: 'role_name', label: 'Role' },
  { key: 'profile_id', label: 'Profile ID' },
  { key: 'profile_name', label: 'Profile' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'confirm', label: 'Confirmed', format: 'boolean' },
];

const noteFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Note ID' },
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Content' },
  { key: 'parent_module', label: 'Parent Module' },
  { key: 'parent_id', label: 'Parent Record ID' },
  { key: 'parent_name', label: 'Parent Record' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'owner_name', label: 'Owner' },
  { key: 'created_time', label: 'Created Time', format: 'datetime' },
  { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'file_name', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'type', label: 'Type' },
  { key: 'link_url', label: 'Link URL', format: 'url' },
  { key: 'file_id', label: 'File ID' },
  { key: 'parent_module', label: 'Parent Module' },
  { key: 'owner_name', label: 'Owner' },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'created_time', label: 'Created Time', format: 'datetime' },
  { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
];

const draftFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Draft ID' },
  { key: 'subject', label: 'Subject' },
  { key: 'from', label: 'From', format: 'email' },
  { key: 'to', label: 'To' },
  { key: 'cc', label: 'Cc' },
  { key: 'bcc', label: 'Bcc' },
  { key: 'reply_to', label: 'Reply To', format: 'email' },
  { key: 'summary', label: 'Summary' },
  { key: 'content', label: 'Content', format: 'html' },
  { key: 'rich_text', label: 'Rich Text', format: 'boolean' },
  { key: 'scheduled_time', label: 'Scheduled Time', format: 'datetime' },
  { key: 'attachment_count', label: 'Attachments', format: 'number' },
  { key: 'created_time', label: 'Created Time', format: 'datetime' },
  { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
];

const pagingFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'more_records', label: 'More Records', format: 'boolean' },
];

export const listModulesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'modules',
      label: 'Modules',
      labelKey: 'plural_label',
      listItems: [
        { key: 'api_name', label: 'API Name' },
        { key: 'module_name', label: 'Module Name' },
        { key: 'plural_label', label: 'Plural Label' },
        { key: 'singular_label', label: 'Singular Label' },
        { key: 'generated_type', label: 'Type' },
        { key: 'creatable', label: 'Creatable', format: 'boolean' },
        { key: 'editable', label: 'Editable', format: 'boolean' },
        { key: 'deletable', label: 'Deletable', format: 'boolean' },
      ],
    },
  ],
};

export const moduleFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'field_label',
      listItems: [
        { key: 'api_name', label: 'API Name' },
        { key: 'field_label', label: 'Label' },
        { key: 'data_type', label: 'Data Type' },
        { key: 'required', label: 'Required on Create', format: 'boolean' },
        { key: 'read_only', label: 'Read Only', format: 'boolean' },
        { key: 'custom_field', label: 'Custom Field', format: 'boolean' },
        { key: 'lookup_module', label: 'Lookup Module' },
        { key: 'max_length', label: 'Max Length', format: 'number' },
        { key: 'picklist_values', label: 'Picklist Values' },
      ],
    },
  ],
};

export const relatedListsOutputSchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'related_lists',
      label: 'Related Lists',
      labelKey: 'display_label',
      listItems: [
        { key: 'api_name', label: 'API Name' },
        { key: 'display_label', label: 'Label' },
        { key: 'module_api_name', label: 'Related Module' },
        { key: 'type', label: 'Type' },
        { key: 'href', label: 'Path' },
        { key: 'status', label: 'Status' },
      ],
    },
  ],
};

export const listUsersOutputSchema: OutputSchema = {
  fields: [...pagingFields, { key: 'users', label: 'Users', labelKey: 'full_name', listItems: userFields }],
};

export const userOutputSchema: OutputSchema = { fields: userFields };

export const listRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    ...pagingFields,
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'next_page_token', label: 'Next Page Token' },
    { key: 'fields_requested', label: 'Fields Requested' },
    { key: 'records', label: 'Records' },
  ],
};

export const aiWriteOutputSchema: OutputSchema = recordWriteOutputSchema;

export const aiUpsertOutputSchema: OutputSchema = {
  fields: [
    ...recordWriteOutputSchema.fields,
    { key: 'action', label: 'Action (insert or update)' },
    { key: 'duplicate_field', label: 'Matched On Field' },
  ],
};

export const listNotesOutputSchema: OutputSchema = {
  fields: [...pagingFields, { key: 'notes', label: 'Notes', labelKey: 'title', listItems: noteFields }],
};

export const noteOutputSchema: OutputSchema = { fields: noteFields };

export const noteWriteOutputSchema: OutputSchema = childWriteOutputSchema;

export const noteChangeOutputSchema: OutputSchema = childChangeOutputSchema;

export const listTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'tags',
      label: 'Tags',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Tag ID' },
        { key: 'name', label: 'Name' },
        { key: 'color_code', label: 'Color' },
        { key: 'created_time', label: 'Created Time', format: 'datetime' },
        { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
      ],
    },
  ],
};

export const createTagOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Tag ID' },
    { key: 'name', label: 'Name' },
    { key: 'color_code', label: 'Color' },
    { key: 'module', label: 'Module' },
    { key: 'created', label: 'Created (false = already existed)', format: 'boolean' },
  ],
};

export const relatedRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'record_id', label: 'Record ID' },
    { key: 'related_list', label: 'Related List' },
    ...pagingFields,
    { key: 'next_page_token', label: 'Next Page Token' },
    { key: 'records', label: 'Related Records' },
  ],
};

export const linkRelatedOutputSchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'record_id', label: 'Record ID' },
    { key: 'related_list', label: 'Related List' },
    { key: 'related_record_id', label: 'Related Record ID' },
    { key: 'status', label: 'Status' },
    { key: 'code', label: 'Code' },
    { key: 'message', label: 'Message' },
  ],
};

export const listAttachmentsOutputSchema: OutputSchema = {
  fields: [...pagingFields, { key: 'attachments', label: 'Attachments', labelKey: 'file_name', listItems: attachmentFields }],
};

export const listDraftsOutputSchema: OutputSchema = {
  fields: [...pagingFields, { key: 'drafts', label: 'Drafts', labelKey: 'subject', listItems: draftFields }],
};

export const draftWriteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Draft ID' },
    { key: 'module', label: 'Module' },
    { key: 'record_id', label: 'Record ID' },
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
  ],
};

export const downloadAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File' },
    { key: 'file_name', label: 'File Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'content_type', label: 'Content Type' },
  ],
};
