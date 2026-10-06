import { OutputSchema } from '@activepieces/pieces-framework';

const presentationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Content' },
  { key: 'n_slides', label: 'Slides', format: 'number' },
  { key: 'language', label: 'Language' },
  { key: 'tone', label: 'Tone' },
  { key: 'verbosity', label: 'Verbosity' },
  { key: 'status', label: 'Status' },
  {
    key: 'theme',
    label: 'Theme',
    children: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const presentationListSmartDesignsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'page_size', label: 'Page Size', format: 'number' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const presentationExportPresentationOutputSchema: OutputSchema = {
  fields: [
    { key: 'presentation_id', label: 'Presentation ID' },
    { key: 'path', label: 'Path', format: 'url' },
    { key: 'edit_path', label: 'Edit Path', format: 'url' },
    { key: 'credits_consumed', label: 'Credits Consumed', format: 'number' },
  ],
};

export const presentationGeneratePresentationOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'presentation_id', label: 'Presentation ID' },
        { key: 'path', label: 'Path', format: 'url' },
        { key: 'edit_path', label: 'Edit Path', format: 'url' },
        { key: 'credits_consumed', label: 'Credits Consumed', format: 'number' },
      ],
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'user', label: 'User' },
    { key: 'type', label: 'Type' },
    { key: 'message', label: 'Message' },
    { key: 'error', label: 'Error' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const presentationDeleteImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'ID' },
  ],
};

export const presentationListImagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'images',
      label: 'Images',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'path', label: 'Path' },
        { key: 'extras', label: 'Extras' },
        { key: 'is_uploaded', label: 'Is Uploaded', format: 'boolean' },
        { key: 'user', label: 'User' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'url', label: 'URL', format: 'image' },
      ],
    },
  ],
};

export const presentationUploadImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'user', label: 'User' },
    { key: 'path', label: 'Path' },
    { key: 'is_uploaded', label: 'Is Uploaded', format: 'boolean' },
    { key: 'url', label: 'URL', format: 'image' },
    { key: 'id', label: 'ID' },
    { key: 'extras', label: 'Extras' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const presentationGenerateOutlineOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'outlines', label: 'Outlines' },
  ],
};

export const presentationListPresentationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'page_size', label: 'Page Size', format: 'number' },
    { key: 'results', label: 'Results', labelKey: 'title', listItems: presentationFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const presentationUploadSourceFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file_ids',
      label: 'File IDs',
      description: 'Pass these as the files input of Generate Presentation or Generate Outline.',
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const newpresentationOutputSchema: OutputSchema = {
  fields: presentationFields,
};

export const presentationGetTaskStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'presentation_id', label: 'Presentation ID' },
        { key: 'path', label: 'Path', format: 'url' },
        { key: 'edit_path', label: 'Edit Path', format: 'url' },
        { key: 'credits_consumed', label: 'Credits Consumed', format: 'number' },
      ],
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'message', label: 'Message' },
    { key: 'user', label: 'User' },
    { key: 'type', label: 'Type' },
    { key: 'error', label: 'Error' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const presentationCreateIntegrationTokenOutputSchema: OutputSchema = {
  fields: [
    { key: 'token', label: 'Token' },
    { key: 'frontend_url', label: 'Frontend URL', format: 'url' },
    { key: 'user', label: 'User' },
    { key: 'presentation', label: 'Presentation' },
    { key: 'scopes', label: 'Scopes' },
    { key: 'version', label: 'Version' },
    { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  ],
};

export const presentationGetTemplateExampleOutputSchema: OutputSchema = {
  fields: [
    { key: 'standard_template', label: 'Standard Template' },
    {
      key: 'slides',
      label: 'Slides',
      labelKey: 'layout',
      listItems: [
        { key: 'layout', label: 'Layout' },
        { key: 'content', label: 'Content' },
      ],
    },
  ],
};

export const presentationGetStandardTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'layout_count', label: 'Layout Count', format: 'number' },
    { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
    { key: 'is_default', label: 'Is Default', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'layouts', label: 'Layouts' },
    { key: 'fonts', label: 'Fonts', dynamicKey: true, format: 'url' },
    { key: 'schemas', label: 'Layout Schemas' },
  ],
};

export const presentationListStandardTemplatesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'layout_count', label: 'Layout Count', format: 'number' },
        { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
        { key: 'is_default', label: 'Is Default', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'page_size', label: 'Page Size', format: 'number' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};
