import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const pageFields: OutputSchemaField[] = [
  { key: 'total_items', label: 'Total Items', format: 'number' },
  { key: 'page_count', label: 'Page Count', format: 'number' },
];

const choiceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Choice ID' },
  { key: 'ref', label: 'Choice Ref' },
  { key: 'label', label: 'Label' },
];

const questionFields: OutputSchemaField[] = [
  { key: 'id', label: 'Field ID' },
  { key: 'ref', label: 'Ref' },
  { key: 'title', label: 'Question' },
  { key: 'type', label: 'Type' },
  { key: 'validations_required', value: 'validations.required', label: 'Required', format: 'boolean' },
  { key: 'properties_choices', value: 'properties.choices', label: 'Choices', labelKey: 'label', listItems: choiceFields },
];

const formFields: OutputSchemaField[] = [
  { key: 'id', label: 'Form ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'links_display', value: '_links.display', label: 'Share Link', format: 'url' },
  { key: 'settings_is_public', value: 'settings.is_public', label: 'Public', format: 'boolean' },
  { key: 'settings_language', value: 'settings.language', label: 'Language' },
  { key: 'workspace_href', value: 'workspace.href', label: 'Workspace', format: 'url' },
  { key: 'theme_href', value: 'theme.href', label: 'Theme', format: 'url' },
  {
    key: 'fields',
    label: 'Questions',
    labelKey: 'title',
    listItems: [
      ...questionFields,
      { key: 'properties_fields', value: 'properties.fields', label: 'Group Questions', labelKey: 'title', listItems: questionFields },
    ],
  },
  { key: 'hidden', label: 'Hidden Fields' },
  {
    key: 'thankyou_screens',
    label: 'Thank-you Screens',
    labelKey: 'title',
    listItems: [
      { key: 'ref', label: 'Ref' },
      { key: 'title', label: 'Title' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'last_updated_at', label: 'Last Updated At', format: 'datetime' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
];

const formSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Form ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'links_display', value: '_links.display', label: 'Share Link', format: 'url' },
  { key: 'settings_is_public', value: 'settings.is_public', label: 'Public', format: 'boolean' },
  { key: 'theme_href', value: 'theme.href', label: 'Theme', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'last_updated_at', label: 'Last Updated At', format: 'datetime' },
];

const answerFields: OutputSchemaField[] = [
  { key: 'field_id', value: 'field.id', label: 'Field ID' },
  { key: 'field_ref', value: 'field.ref', label: 'Field Ref' },
  { key: 'field_type', value: 'field.type', label: 'Question Type' },
  { key: 'type', label: 'Answer Type' },
  { key: 'text', label: 'Text' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'boolean', label: 'Yes/No', format: 'boolean' },
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'file_url', label: 'File', format: 'url' },
  { key: 'choice_label', value: 'choice.label', label: 'Choice' },
  { key: 'choices_labels', value: 'choices.labels', label: 'Choices' },
];

const responseFields: OutputSchemaField[] = [
  { key: 'response_id', label: 'Response ID' },
  { key: 'token', label: 'Token' },
  { key: 'response_type', label: 'Response Type' },
  { key: 'submitted_at', label: 'Submitted At', format: 'datetime' },
  { key: 'landed_at', label: 'Landed At', format: 'datetime' },
  { key: 'answers', label: 'Answers', labelKey: 'field.ref', listItems: answerFields },
  { key: 'hidden', label: 'Hidden Fields' },
  { key: 'calculated_score', value: 'calculated.score', label: 'Score', format: 'number' },
  { key: 'metadata_referer', value: 'metadata.referer', label: 'Referrer', format: 'url' },
  { key: 'metadata_platform', value: 'metadata.platform', label: 'Platform' },
  { key: 'thankyou_screen_ref', label: 'Thank-you Screen Ref' },
];

const workspaceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Workspace ID' },
  { key: 'name', label: 'Name' },
  { key: 'account_id', label: 'Account ID' },
  { key: 'default', label: 'Default', format: 'boolean' },
  { key: 'shared', label: 'Shared', format: 'boolean' },
  { key: 'forms_count', value: 'forms.count', label: 'Form Count', format: 'number' },
];

const workspaceDetailFields: OutputSchemaField[] = [
  ...workspaceFields,
  {
    key: 'members',
    label: 'Members',
    labelKey: 'email',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'role', label: 'Role' },
    ],
  },
];

const themeFields: OutputSchemaField[] = [
  { key: 'id', label: 'Theme ID' },
  { key: 'name', label: 'Name' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'font', label: 'Font' },
  { key: 'colors_question', value: 'colors.question', label: 'Question Color' },
  { key: 'colors_answer', value: 'colors.answer', label: 'Answer Color' },
  { key: 'colors_button', value: 'colors.button', label: 'Button Color' },
  { key: 'colors_background', value: 'colors.background', label: 'Background Color' },
  { key: 'fields_alignment', value: 'fields.alignment', label: 'Question Alignment' },
  { key: 'fields_font_size', value: 'fields.font_size', label: 'Question Font Size' },
  { key: 'screens_alignment', value: 'screens.alignment', label: 'Screen Alignment' },
  { key: 'screens_font_size', value: 'screens.font_size', label: 'Screen Font Size' },
  { key: 'has_transparent_button', label: 'Transparent Button', format: 'boolean' },
  { key: 'rounded_corners', label: 'Rounded Corners' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const imageFields: OutputSchemaField[] = [
  { key: 'id', label: 'Image ID' },
  { key: 'file_name', label: 'File Name' },
  { key: 'src', label: 'Image', format: 'image' },
  { key: 'media_type', label: 'Media Type' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
];

export const accountOutputSchema: OutputSchema = {
  fields: [
    { key: 'user_id', label: 'User ID' },
    { key: 'alias', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'language', label: 'Language' },
  ],
};

export const formsOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Forms', labelKey: 'title', listItems: formSummaryFields }, ...pageFields],
};

export const formOutputSchema: OutputSchema = {
  fields: formFields,
};

export const deleteFormOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'form_id', label: 'Form ID' },
  ],
};

export const responsesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Responses', labelKey: 'submitted_at', listItems: responseFields }, ...pageFields],
};

export const deleteResponsesOutputSchema: OutputSchema = {
  fields: [
    { key: 'registered', label: 'Deletion Requested', format: 'boolean' },
    { key: 'form_id', label: 'Form ID' },
    { key: 'response_ids', label: 'Response IDs' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const workspacesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Workspaces', labelKey: 'name', listItems: workspaceFields }, ...pageFields],
};

export const workspaceOutputSchema: OutputSchema = {
  fields: workspaceDetailFields,
};

export const deleteWorkspaceOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'workspace_id', label: 'Workspace ID' },
  ],
};

export const themesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Themes', labelKey: 'name', listItems: themeFields }, ...pageFields],
};

export const themeOutputSchema: OutputSchema = {
  fields: themeFields,
};

export const deleteThemeOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'theme_id', label: 'Theme ID' },
  ],
};

export const imagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Images', labelKey: 'file_name', listItems: imageFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_items', label: 'Total Images', format: 'number' },
  ],
};

export const imageOutputSchema: OutputSchema = {
  fields: imageFields,
};

export const deleteImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'image_id', label: 'Image ID' },
  ],
};

export const newSubmissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'form_id', label: 'Form ID' },
    { key: 'token', label: 'Response Token' },
    { key: 'submitted_at', label: 'Submitted At', format: 'datetime' },
    { key: 'landed_at', label: 'Landed At', format: 'datetime' },
    { key: 'definition_title', value: 'definition.title', label: 'Form Title' },
    {
      key: 'definition_fields', value: 'definition.fields',
      label: 'Questions',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'Field ID' },
        { key: 'ref', label: 'Ref' },
        { key: 'title', label: 'Question' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'answers', label: 'Answers', labelKey: 'field.ref', listItems: answerFields },
    { key: 'hidden', label: 'Hidden Fields' },
    { key: 'calculated_score', value: 'calculated.score', label: 'Score', format: 'number' },
    { key: 'thankyou_screen_ref', label: 'Thank-you Screen Ref' },
  ],
};
