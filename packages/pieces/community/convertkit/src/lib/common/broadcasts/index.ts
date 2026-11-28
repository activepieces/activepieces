import { Property } from '@activepieces/pieces-framework';

export const broadcastId = Property.ShortText({
  displayName: 'Broadcast ID',
  description: "Find it in the broadcast's URL in Kit.",
  placeholder: '1234567',
  required: true,
});

export const broadcastPageNumber = Property.Number({
  displayName: 'Page',
  description: 'Up to 50 broadcasts per page.',
  required: false,
  defaultValue: 1,
});

export const broadcastContent = Property.ShortText({
  displayName: 'Content',
  description:
    'The email body. Simple HTML such as p, h1 and img tags works.',
  required: false,
});
export const description = Property.ShortText({
  displayName: 'Internal Description',
  description: 'Only visible to you in Kit.',
  required: false,
});
export const broadcastEmailAddress = Property.ShortText({
  displayName: 'From Email',
  description: "Sending address. Empty: your account's default.",
  placeholder: 'you@example.com',
  required: false,
});
export const emailLayoutTemplate = Property.ShortText({
  displayName: 'Email Template',
  description: "Template name. Empty: your account's default.",
  required: false,
});
export const isPublic = Property.Checkbox({
  displayName: 'Public',
  description:
    'Also publish this broadcast as a post on your Creator Profile.',
  required: false,
  defaultValue: false,
});
export const publishedAt = Property.DateTime({
  displayName: 'Published At',
  description: 'Date shown on the public post.',
  required: false,
});
export const sendAt = Property.DateTime({
  displayName: 'Send At',
  description: 'Empty saves a draft; a future time schedules the send.',
  required: false,
});
export const subject = Property.ShortText({
  displayName: 'Subject',
  description: 'The email subject line.',
  required: false,
});
export const thumbnailAlt = Property.ShortText({
  displayName: 'Thumbnail Alt Text',
  description: 'Describes the thumbnail for screen readers.',
  required: false,
});
export const thumbnailUrl = Property.ShortText({
  displayName: 'Thumbnail URL',
  description: 'Image shown with the public post.',
  placeholder: 'https://example.com/cover.png',
  required: false,
});
