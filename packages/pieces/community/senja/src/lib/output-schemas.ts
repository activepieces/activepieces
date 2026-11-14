import { OutputSchema } from '@activepieces/pieces-framework';

const testimonialFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Testimonial ID' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'text', label: 'Text' },
  { key: 'rating', label: 'Rating', format: 'number' },
  { key: 'url', label: 'Source URL', format: 'url' },
  { key: 'public_url', label: 'Public URL', format: 'url' },
  { key: 'dashboard_url', label: 'Senja Dashboard URL', format: 'url' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'approved', label: 'Approved', format: 'boolean' },
  { key: 'reward', label: 'Reward' },
  { key: 'integration', label: 'Source / Integration' },
  { key: 'tags', label: 'Tags' },
  { key: 'lang', label: 'Language' },
  { key: 'video_url', label: 'Video URL', format: 'url' },
  { key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
  { key: 'form_id', label: 'Form ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
  { key: 'customer_company', label: 'Customer Company' },
  { key: 'customer_tagline', label: 'Customer Tagline' },
  { key: 'customer_username', label: 'Customer Username' },
  { key: 'customer_url', label: 'Customer Profile URL', format: 'url' },
  { key: 'customer_avatar', label: 'Customer Avatar', format: 'image' },
  { key: 'customer_company_logo', label: 'Company Logo', format: 'image' },
  { key: 'customer_custom_data', label: 'Customer Custom Data', dynamicKey: true },
  { key: 'media', label: 'Media' },
  { key: 'video_duration', label: 'Video Duration', format: 'duration' },
  { key: 'video_aspect_ratio', label: 'Video Aspect Ratio' },
  { key: 'video_hls_url', label: 'Video HLS URL', format: 'url' },
  { key: 'video_mp4_low', label: 'Video MP4 (Low)', format: 'url' },
  { key: 'video_mp4_medium', label: 'Video MP4 (Medium)', format: 'url' },
  { key: 'video_mp4_high', label: 'Video MP4 (High)', format: 'url' },
  { key: 'video_transcript', label: 'Video Transcript' },
  { key: 'translations', label: 'Translations' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const testimonialActionOutputSchema: OutputSchema = {
  fields: testimonialFields,
};

export const findTestimonialsActionOutputSchema: OutputSchema = {
  itemLabel: '{customer_name}',
  fields: [
    {
      key: 'testimonials',
      label: 'Testimonials',
      value: '',
      listItems: testimonialFields,
    },
  ],
};

export const deleteTestimonialActionOutputSchema: OutputSchema = {
  fields: [{ key: 'message', label: 'Message' }],
};

export const testimonialEventTriggerOutputSchema: OutputSchema = {
  fields: [{ key: 'event_type', label: 'Event Type' }, ...testimonialFields],
};

export const sendFormInviteActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'sent', label: 'Invites Sent', format: 'number' },
    { key: 'skipped_count', label: 'Skipped Count', format: 'number' },
    {
      key: 'skipped',
      label: 'Skipped Recipients',
      labelKey: 'email',
      listItems: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'reason', label: 'Reason' },
      ],
    },
  ],
};

export const listLinksActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'links',
      label: 'Links',
      value: '',
      listItems: [
        { key: 'type', label: 'Link Type' },
        { key: 'id', label: 'Link ID' },
        { key: 'name', label: 'Name' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'widget_type', label: 'Widget Type' },
      ],
    },
  ],
};
