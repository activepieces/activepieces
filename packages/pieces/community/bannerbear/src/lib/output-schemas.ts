import { OutputSchema } from '@activepieces/pieces-framework';

export const bannerbearOutputSchemas: Record<string, OutputSchema> = {
  createImage: { fields: [...imageFields(), timedOutField()] },
  image: { fields: imageFields() },
  listImages: {
    fields: [
      {
        key: 'items',
        label: 'Images',
        labelKey: 'uid',
        listItems: imageFields(),
      },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  template: { fields: templateFields() },
  listTemplates: {
    fields: [
      {
        key: 'items',
        label: 'Templates',
        labelKey: 'name',
        listItems: templateFields().filter((f) => f.key !== 'layers'),
      },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  screenshot: {
    fields: [
      { key: 'uid', label: 'Screenshot ID' },
      { key: 'status', label: 'Status' },
      { key: 'url', label: 'Page URL', format: 'url' },
      { key: 'screenshot_image_url', label: 'Screenshot URL', format: 'url' },
      { key: 'width', label: 'Width', format: 'number' },
      { key: 'height', label: 'Height', format: 'number' },
      { key: 'mobile', label: 'Mobile', format: 'boolean' },
      { key: 'self', label: 'API URL', format: 'url' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      timedOutField(),
    ],
  },
  collection: {
    fields: [
      { key: 'uid', label: 'Collection ID' },
      { key: 'status', label: 'Status' },
      { key: 'template_set', label: 'Template Set ID' },
      {
        key: 'images',
        label: 'Images',
        labelKey: 'template_uid',
        listItems: [
          { key: 'uid', label: 'Image ID' },
          { key: 'status', label: 'Status' },
          { key: 'template_uid', label: 'Template ID' },
          { key: 'image_url', label: 'Image URL', format: 'url' },
        ],
      },
      { key: 'metadata', label: 'Metadata' },
      { key: 'self', label: 'API URL', format: 'url' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      timedOutField(),
    ],
  },
  animatedGif: {
    fields: [
      { key: 'uid', label: 'GIF ID' },
      { key: 'status', label: 'Status' },
      { key: 'template_uid', label: 'Template ID' },
      { key: 'image_url', label: 'GIF URL', format: 'url' },
      { key: 'fps', label: 'Frames per Second', format: 'number' },
      { key: 'metadata', label: 'Metadata' },
      { key: 'self', label: 'API URL', format: 'url' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      timedOutField(),
    ],
  },
  account: {
    fields: [
      { key: 'uid', label: 'Account ID' },
      { key: 'api_version', label: 'API Version' },
      { key: 'plan', label: 'Plan' },
      { key: 'project_name', label: 'Project / Workspace' },
      { key: 'api_usage', label: 'Credits Used', format: 'number' },
      { key: 'api_quota', label: 'Credit Quota', format: 'number' },
      { key: 'api_remaining', label: 'Credits Remaining', format: 'number' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
  },
};

function imageFields(): OutputSchema['fields'] {
  return [
    { key: 'uid', label: 'Image ID' },
    { key: 'status', label: 'Status' },
    { key: 'template_uid', label: 'Template ID' },
    { key: 'image_url', label: 'Image URL', format: 'url' },
    { key: 'image_url_png', label: 'PNG URL', format: 'url' },
    { key: 'image_url_jpg', label: 'JPG URL', format: 'url' },
    { key: 'pdf_url', label: 'PDF URL', format: 'url' },
    { key: 'metadata', label: 'Metadata' },
    { key: 'error', label: 'Error' },
    { key: 'self', label: 'API URL', format: 'url' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  ];
}

function templateFields(): OutputSchema['fields'] {
  return [
    { key: 'uid', label: 'Template ID' },
    { key: 'name', label: 'Name' },
    { key: 'width', label: 'Width', format: 'number' },
    { key: 'height', label: 'Height', format: 'number' },
    { key: 'preview_url', label: 'Preview', format: 'image' },
    { key: 'tags', label: 'Tags' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    {
      key: 'layers',
      label: 'Layers',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Layer Name' },
        { key: 'id', label: 'Layer ID' },
        { key: 'type', label: 'Layer Type' },
      ],
    },
  ];
}

function timedOutField(): OutputSchema['fields'][number] {
  return {
    key: 'timed_out',
    label: 'Still Rendering (Wait Timed Out)',
    format: 'boolean',
  };
}
