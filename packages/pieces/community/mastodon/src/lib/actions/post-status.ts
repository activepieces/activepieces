import FormData from 'form-data';
import { Property, createAction, ApFile } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonProps, mastodonUtils } from '../common/client';
import { postStatusOutputSchema } from '../output-schemas';

const uploadMedia = async (media: ApFile, baseUrl: string, token: string) => {
  const formData = new FormData();
  formData.append('file', Buffer.from(media.base64, 'base64'), media.filename);

  const postMediaResponse = await httpClient.sendRequest({
    url: `${baseUrl}/api/v2/media`,
    method: HttpMethod.POST,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    headers: {
      'Content-type': 'multipart/form-data',
    },
    body: formData,
  });

  return postMediaResponse.body.id;
};

export const postStatus = createAction({
  auth: mastodonAuth,
  name: 'post_status',
  classification: 'WRITE',
  displayName: 'Post Status',
  description: 'Post a status, optionally with media, a content warning or a reply.',
  audience: 'human',
  aiMetadata: { description: 'Publishes a new status (toot) to a Mastodon instance from the authenticated account, optionally attaching a media file uploaded alongside the post and media already uploaded with Upload Media, with optional visibility, content warning, reply target and sensitive flag. Use to broadcast a message or share content on Mastodon. Requires status text; not idempotent — each call creates a separate post.', idempotent: false },
  outputSchema: postStatusOutputSchema,
  propertyGroups: [
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['status', 'spoiler_text'],
    },
    {
      key: 'attachments',
      display: 'section',
      label: 'Attachments',
      icon: 'paperclip',
      props: ['media', 'media_ids', 'sensitive'],
    },
    {
      key: 'delivery',
      display: 'section',
      label: 'Delivery',
      icon: 'send',
      props: ['visibility', 'in_reply_to_id'],
    },
  ],
  props: {
    status: Property.LongText({
      displayName: 'Status Text',
      description: 'Mentions, hashtags and links work as they do in Mastodon.',
      required: true,
    }),
    media: Property.File({
      displayName: 'Media',
      description: 'An image, video or audio file, or its URL.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Empty uses your account default. Unlisted stays off public timelines.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Followers only', value: 'private' },
          { label: 'Mentioned people only', value: 'direct' },
        ],
      },
    }),
    spoiler_text: Property.ShortText({
      displayName: 'Content Warning',
      description: 'Shown in place of the text until the reader opens the status.',
      placeholder: 'Spoilers ahead',
      required: false,
    }),
    in_reply_to_id: Property.ShortText({
      displayName: 'Reply To Status ID',
      description: 'ID of the status to answer. Leave empty for a new status.',
      placeholder: '109372843234737004',
      required: false,
    }),
    media_ids: Property.Array({
      displayName: 'Media IDs',
      description: 'From Upload Media, one per item. Most servers allow 4 in total.',
      required: false,
    }),
    sensitive: mastodonProps.optionalBoolean({
      displayName: 'Mark Media as Sensitive',
      description: 'Hide the media behind a warning. Empty uses your account default.',
    }),
  },
  async run(context) {
    const token = context.auth.props.access_token;
    const { status, media, visibility, spoiler_text, in_reply_to_id, media_ids, sensitive } =
      context.propsValue;
    const baseUrl = context.auth.props.base_url.replace(/\/$/, '');

    const mediaId = media ? await uploadMedia(media, baseUrl, token) : undefined;
    const mediaIds = [
      ...(mastodonUtils.toStringArray(media_ids) ?? []),
      ...(mediaId ? [mediaId] : []),
    ];

    return await httpClient.sendRequest({
      url: `${baseUrl}/api/v1/statuses`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: {
        status,
        ...(mastodonUtils.hasValue(visibility) ? { visibility } : {}),
        ...(mastodonUtils.hasValue(spoiler_text) ? { spoiler_text } : {}),
        ...(mastodonUtils.hasValue(in_reply_to_id) ? { in_reply_to_id } : {}),
        ...(typeof sensitive === 'boolean' ? { sensitive } : {}),
        ...(mediaIds.length > 0 ? { media_ids: mediaIds } : {}),
      },
    });
  },
});
