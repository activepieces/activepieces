import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function envelope({ data }: { data: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'code', label: 'Response Code', format: 'number', description: '0 means success.' },
      { key: 'msg', label: 'Message' },
      { key: 'data', label: 'Data', children: data },
    ],
  };
}

const videoIdField: OutputSchemaField = {
  key: 'video_id',
  label: 'Video ID',
  description: 'Use this to check the video status or match it to a webhook event.',
};

const publicAvatarFields: OutputSchemaField[] = [
  { key: 'id', label: 'Avatar ID', description: 'Use as avatar_id with avatar type 0 (public).' },
  { key: 'name', label: 'Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'style', label: 'Style' },
  { key: 'aspect_ratio', label: 'Aspect Ratio', format: 'number', description: '0 portrait, 1 landscape, 2 square.' },
  { key: 'cover_url', label: 'Cover Image', format: 'image' },
  { key: 'video_url', label: 'Preview Video', format: 'url' },
];

const customAvatarFields: OutputSchemaField[] = [
  { key: 'id', label: 'Avatar ID', description: 'Use as avatar_id with avatar type 1 (custom).' },
  { key: 'name', label: 'Name' },
  { key: 'avatar_status', label: 'Status', description: 'processing, completed or failed.' },
  { key: 'fail_msg', label: 'Failure Message' },
  { key: 'cover_url', label: 'Cover Image', format: 'image' },
  { key: 'video_url', label: 'Preview Video', format: 'url' },
];

const photoAvatarFields: OutputSchemaField[] = [
  { key: 'id', label: 'Avatar ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', format: 'number', description: '0 processing, 1 completed, 2 failed.' },
  { key: 'fail_msg', label: 'Failure Message' },
  { key: 'cover_url', label: 'Cover Image', format: 'image' },
];

const voiceFields: OutputSchemaField[] = [
  { key: 'voice_id', label: 'Voice ID', description: 'Use as voice_id when creating a video.' },
  { key: 'name', label: 'Name' },
  { key: 'language', label: 'Language' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'accent', label: 'Accent' },
  { key: 'use_case', label: 'Use Case' },
  { key: 'is_custom', label: 'Custom Voice', format: 'boolean' },
  { key: 'audio_url', label: 'Sample Audio', format: 'url' },
];

const templateVariableFields: OutputSchemaField[] = [
  { key: 'type', label: 'Type', description: 'text, image, video or script.' },
  { key: 'name', label: 'Name' },
];

const templateFields: OutputSchemaField[] = [
  { key: 'template_id', label: 'Template ID' },
  { key: 'name', label: 'Name' },
  { key: 'aspect_ratio', label: 'Aspect Ratio', format: 'number' },
  { key: 'cover_url', label: 'Cover Image', format: 'image' },
  { key: 'preview_url', label: 'Preview', format: 'url' },
  { key: 'variables', label: 'Variables', labelKey: 'name', listItems: templateVariableFields },
];

const webhookEventFields: OutputSchemaField[] = [
  { key: 'event_id', label: 'Event ID' },
  { key: 'event', label: 'Event' },
  { key: 'timestamp', label: 'Timestamp', format: 'number', description: 'Unix time in seconds.' },
  {
    key: 'data',
    label: 'Data',
    children: [
      { key: 'video_id', label: 'Video ID' },
      { key: 'project_id', label: 'Project ID', description: 'Same value as Video ID.' },
      { key: 'video_url', label: 'Video URL', format: 'url' },
      { key: 'duration', label: 'Duration (seconds)', format: 'number', description: 'Decimal seconds, e.g. 2.93.' },
      { key: 'status', label: 'Status', description: 'Only set on failed events.' },
      {
        key: 'error',
        label: 'Error',
        description: 'Only set on failed events.',
        children: [
          { key: 'code', label: 'Error Code', format: 'number' },
          { key: 'message', label: 'Error Message' },
        ],
      },
    ],
  },
];

export const joggAiOutputSchemas = {
  createAvatarVideo: envelope({
    data: [videoIdField, { key: 'project_id', label: 'Project ID' }],
  }),
  createVideoFromTemplate: envelope({
    data: [videoIdField, { key: 'project_id', label: 'Project ID' }],
  }),
  createAiAvatarPhoto: envelope({
    data: [{ key: 'photo_id', label: 'Photo ID', description: 'Use this to check the photo generation status.' }],
  }),
  productEnvelope: envelope({
    data: [{ key: 'product_id', label: 'Product ID' }],
  }),
  updateProductEnvelope: {
    fields: [
      { key: 'code', label: 'Response Code', format: 'number', description: '0 means success.' },
      { key: 'msg', label: 'Message' },
    ],
  },
  getGeneratedVideo: envelope({
    data: [
      { key: 'project_id', label: 'Project ID' },
      { key: 'id', label: 'ID' },
      { key: 'status', label: 'Status' },
      { key: 'title', label: 'Title' },
      { key: 'video_url', label: 'Video URL', format: 'url' },
      { key: 'cover_url', label: 'Cover Image', format: 'image' },
      { key: 'duration', label: 'Duration (seconds)', format: 'number' },
      { key: 'created_at', label: 'Created At', format: 'number' },
    ],
  }),
  uploadMedia: envelope({
    data: [
      {
        key: 'sign_url',
        label: 'Signed Upload URL',
        format: 'url',
        description: 'PUT the file bytes here with header Content-Type: application/octet-stream. Any other content type is rejected with 403. It expires.',
      },
      {
        key: 'asset_id',
        label: 'Asset URL',
        format: 'url',
        description: 'The JoggAI-hosted URL of the file after upload. Use it as a media URL in products and videos.',
      },
    ],
  }),
  aiCreateVideo: { fields: [videoIdField] },
  aiGetAvatarVideo: {
    fields: [
      { key: 'video_id', label: 'Video ID' },
      { key: 'status', label: 'Status', description: 'pending, processing, completed or failed.' },
      { key: 'video_url', label: 'Video URL', format: 'url' },
      { key: 'cover_url', label: 'Cover Image', format: 'image' },
      { key: 'created_at', label: 'Created At', format: 'number' },
    ],
  },
  aiGetTemplateVideo: {
    fields: [
      { key: 'video_id', label: 'Video ID' },
      { key: 'status', label: 'Status', description: 'pending, processing, completed or failed.' },
      { key: 'video_name', label: 'Video Name', value: 'data.video_name' },
      { key: 'video_url', label: 'Video URL', format: 'url', value: 'data.url' },
      { key: 'cover_url', label: 'Cover Image', format: 'image', value: 'data.cover_url' },
      { key: 'duration_seconds', label: 'Duration (seconds)', format: 'number', value: 'data.duration_seconds' },
      { key: 'deducted_credit', label: 'Credits Used', format: 'number', value: 'data.deducted_credit' },
      { key: 'created_at', label: 'Created At', format: 'number' },
      { key: 'completed_at', label: 'Completed At', format: 'number' },
    ],
  },
  aiCreatePhotoAvatar: {
    fields: [{ key: 'photo_id', label: 'Photo ID', description: 'Use this with Get Photo Avatar Status.' }],
  },
  aiGetPhotoAvatarStatus: {
    fields: [
      { key: 'photo_id', label: 'Photo ID' },
      { key: 'status', label: 'Status', description: 'in_progress, success or error.' },
      {
        key: 'image_url_list',
        label: 'Image URLs',
        description: 'Can be null even when status is success; the images may need the motion or selection step in JoggAI.',
      },
      { key: 'image_key_list', label: 'Image Keys', description: 'Can be null even when status is success.' },
      { key: 'msg', label: 'Message', description: 'Can be null.' },
    ],
  },
  aiProduct: { fields: [{ key: 'product_id', label: 'Product ID' }] },
  aiListPublicAvatars: {
    fields: [{ key: 'avatars', label: 'Avatars', labelKey: 'name', listItems: publicAvatarFields }],
  },
  aiListCustomAvatars: {
    fields: [{ key: 'avatars', label: 'Avatars', labelKey: 'name', listItems: customAvatarFields }],
  },
  aiListPhotoAvatars: {
    fields: [{ key: 'avatars', label: 'Photo Avatars', labelKey: 'name', listItems: photoAvatarFields }],
  },
  aiListVoices: {
    fields: [
      { key: 'voices', label: 'Voices', labelKey: 'name', listItems: voiceFields },
      { key: 'has_more', label: 'More Public Voices', format: 'boolean' },
    ],
  },
  aiListTemplates: {
    fields: [{ key: 'templates', label: 'Templates', labelKey: 'name', listItems: templateFields }],
  },
  aiGetTemplate: { fields: templateFields },
  aiRemainingQuota: {
    fields: [{ key: 'remaining_quota', label: 'Remaining Quota', format: 'number' }],
  },
  webhookEvent: { fields: webhookEventFields },
} satisfies Record<string, OutputSchema>;
