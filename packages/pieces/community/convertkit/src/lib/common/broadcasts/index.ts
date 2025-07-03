import { Property } from '@activepieces/pieces-framework';

export const broadcastId = Property.ShortText({
  displayName: 'Broadcast Id',
  description: 'The broadcast id',
  required: true,
});

export const broadcastPageNumber = Property.Number({
  displayName: 'Page',
  description:
    'Page number. Each page of results will contain up to 50 broadcasts.',
  required: false,
  defaultValue: 1,
});

export const broadcastContent = Property.ShortText({
  displayName: 'Content',
  description:
    "The broadcast's email content - this can contain text and simple HTML markdown (such as h1, img or p tags)",
  required: false,
});
export const description = Property.ShortText({
  displayName: 'Description',
  description: 'An internal description of this broadcast',
  required: false,
});
export const broadcastEmailAddress = Property.ShortText({
  displayName: 'Email Address',
  description:
    "Sending email address; leave blank to use your account's default sending email address",
  required: false,
});
export const emailLayoutTemplate = Property.ShortText({
  displayName: 'Email Layout Template',
  description:
    "Name of the email template to use; leave blank to use your account's default email template",
  required: false,
});
export const isPublic = Property.Checkbox({
  displayName: 'Public',
  description: 'Specifies whether or not this is a public post',
  required: false,
  defaultValue: false,
});
export const publishedAt = Property.DateTime({
  displayName: 'Published At',
  description:
    'Specifies the time that this post was published (applicable only to public posts)',
  required: false,
});
export const sendAt = Property.DateTime({
  displayName: 'Send At',
  description:
    'Time that this broadcast should be sent; leave blank to create a draft broadcast. If set to a future time, this is the time that the broadcast will be scheduled to send.',
  required: false,
});
export const subject = Property.ShortText({
  displayName: 'Subject',
  description: "The broadcast email's subject",
  required: false,
});
export const thumbnailAlt = Property.ShortText({
  displayName: 'Thumbnail Alt',
  description:
    'Specify the ALT attribute of the public thumbnail image (applicable only to public posts)',
  required: false,
});
export const thumbnailUrl = Property.ShortText({
  displayName: 'Thumbnail Url',
  description:
    'Specify the URL of the thumbnail image to accompany the broadcast post (applicable only to public posts)',
  required: false,
});
