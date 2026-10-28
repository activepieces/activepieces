import { OutputSchema } from '@activepieces/pieces-framework';

type Field = OutputSchema['fields'][number];

const formatField = ({ key, label }: { key: string; label: string }): Field => ({
  key,
  label,
  children: [
    { key: 'status', label: `${label} Status`, description: 'completed, failed or skipped.' },
    { key: 'url', label: `${label} URL`, format: 'url', description: 'Signed URL, valid for about 24 hours.' },
    { key: 'error', label: `${label} Error` },
  ],
});

const generationFields: Field[] = [
  { key: 'generation_id', label: 'Generation ID' },
  { key: 'status', label: 'Status', description: 'pending, in_progress, completed or failed.' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'error', label: 'Error' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'generation_type', label: 'Generation Type' },
  { key: 'presentation_id', label: 'Presentation ID' },
  { key: 'slide_id', label: 'Slide ID', description: 'Set when a slide was added.' },
  { key: 'link_url', label: 'Presentation Link', format: 'url' },
  { key: 'pdf_url', label: 'PDF URL', format: 'url' },
  { key: 'ppt_url', label: 'PowerPoint URL', format: 'url' },
  {
    key: 'formats',
    label: 'Formats',
    children: [
      formatField({ key: 'link', label: 'Link' }),
      formatField({ key: 'pdf', label: 'PDF' }),
      formatField({ key: 'ppt', label: 'PowerPoint' }),
    ],
  },
  {
    key: 'transcripts',
    label: 'Speaker Notes',
    labelKey: 'title',
    listItems: [
      { key: 'slide_id', label: 'Slide ID' },
      { key: 'slide_order', label: 'Slide Order', format: 'number' },
      { key: 'title', label: 'Slide Title' },
      { key: 'content', label: 'Speaker Notes' },
      { key: 'layout', label: 'Layout' },
    ],
  },
];

export const alaiOutputSchemas = {
  generation: { fields: generationFields },
  deletePresentation: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'presentation_id', label: 'Presentation ID' },
    ],
  },
  deleteSlide: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'presentation_id', label: 'Presentation ID' },
      { key: 'slide_id', label: 'Slide ID' },
    ],
  },
  listPresentations: {
    fields: [
      {
        key: 'presentations',
        label: 'Presentations',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Presentation ID' },
          { key: 'title', label: 'Title' },
        ],
      },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'total', label: 'Total Matching', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean' },
    ],
  },
  listThemes: {
    fields: [
      {
        key: 'themes',
        label: 'Themes',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Theme ID' },
          { key: 'name', label: 'Name' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  listVibes: {
    fields: [
      {
        key: 'vibes',
        label: 'Vibes',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Vibe ID' },
          { key: 'name', label: 'Name' },
          { key: 'source', label: 'Source' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  uploadImages: {
    fields: [
      { key: 'image_ids', label: 'Image IDs', description: 'Pass these to Generate Presentation.' },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'response', label: 'Raw Response' },
    ],
  },
  customApiCall: {
    fields: [
      { key: 'status', label: 'Status Code', format: 'number' },
      { key: 'headers', label: 'Headers', dynamicKey: true },
      { key: 'body', label: 'Body' },
    ],
  },
} satisfies Record<string, OutputSchema>;
