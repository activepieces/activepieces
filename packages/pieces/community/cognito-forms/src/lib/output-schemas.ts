import { OutputSchema } from '@activepieces/pieces-framework';

export const entryOutputSchema: OutputSchema = {
  fields: [
    { key: 'entry_id', label: 'Entry ID' },
    { key: 'entry_number', label: 'Entry Number', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'version', label: 'Version', format: 'number' },
    { key: 'date_created', label: 'Date Created', format: 'datetime' },
    { key: 'date_submitted', label: 'Date Submitted', format: 'datetime' },
    { key: 'date_updated', label: 'Date Updated', format: 'datetime' },
    { key: 'admin_link', label: 'Admin Link', format: 'url' },
    { key: 'public_link', label: 'Public Link', format: 'url' },
    { key: 'internal_link', label: 'Internal Link', format: 'url' },
    { key: 'form_id', label: 'Form ID' },
    { key: 'form_name', label: 'Form Name' },
    { key: 'fields', label: 'Fields' },
  ],
};

export const deleteEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'already_deleted', label: 'Already Deleted', format: 'boolean' },
    { key: 'form_id', label: 'Form ID' },
    { key: 'entry_id', label: 'Entry ID' },
  ],
};

export const listFormsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'forms',
      label: 'Forms',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Form ID' },
        { key: 'name', label: 'Name' },
        { key: 'internal_name', label: 'Internal Name' },
      ],
    },
  ],
};

export const formSchemaOutputSchema: OutputSchema = {
  fields: [
    { key: 'form_id', label: 'Form ID' },
    { key: 'field_count', label: 'Field Count', format: 'number' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'required', label: 'Required', format: 'boolean' },
        { key: 'read_only', label: 'Read Only', format: 'boolean' },
        { key: 'description', label: 'Description' },
        { key: 'allowed_values', label: 'Allowed Values' },
      ],
    },
    { key: 'raw_schema', label: 'Raw Schema' },
  ],
};

export const availabilityOutputSchema: OutputSchema = {
  fields: [
    { key: 'form_id', label: 'Form ID' },
    { key: 'availability_start', label: 'Available From', format: 'datetime' },
    { key: 'availability_end', label: 'Available Until', format: 'datetime' },
    { key: 'not_available_message', label: 'Not Available Message' },
  ],
};

export const fileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'file_id', label: 'File ID' },
    { key: 'file_name', label: 'File Name' },
    { key: 'content_type', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'url', label: 'Temporary Download Link', format: 'url' },
  ],
};
