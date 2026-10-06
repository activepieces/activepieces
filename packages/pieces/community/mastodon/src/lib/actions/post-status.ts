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
  description:
    'Post a status to Mastodon, optionally as a reply, with a content warning or with limited visibility.',
  audience: 'human',
  aiMetadata: { description: 'Publishes a new status (toot) to a Mastodon instance from the authenticated account, optionally attaching a media file uploaded alongside the post and media already uploaded with Upload Media, with optional visibility, content warning, reply target and sensitive flag. Use to broadcast a message or share content on Mastodon. Requires status text; not idempotent — each call creates a separate post.', idempotent: false },
  outputSchema: postStatusOutputSchema,
  props: {
    status: Property.LongText({
      displayName: 'Status',
      description: 'The text of your status',
      required: true,
    }),
    media: Property.File({
      displayName: 'Media URL or File',
      description: 'The media attachment for your status',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description:
        'Who can see the post. Leave empty to use the default posting privacy from your Mastodon preferences.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Unlisted (public, hidden from public timelines)', value: 'unlisted' },
          { label: 'Followers only', value: 'private' },
          { label: 'Direct (mentioned accounts only)', value: 'direct' },
        ],
      },
    }),
    spoiler_text: Property.ShortText({
      displayName: 'Content Warning',
      description:
        'Optional warning shown in place of the post text until the reader chooses to reveal it, for example "Spoilers for episode 3".',
      required: false,
    }),
    in_reply_to_id: Property.ShortText({
      displayName: 'Reply To (Status ID)',
      description:
        'To post a reply, the ID of the status you are answering: map the Status ID from the New Mention trigger (Related Status > Status ID), from Get Status, or from a previous Post Status step (Status > Status ID). Leave empty for a new post.',
      required: false,
    }),
    media_ids: Property.Array({
      displayName: 'Media IDs',
      description:
        'IDs of media you already uploaded with the Upload Media action, one per item. Most servers allow 4 attachments in total, including the file above. Leave empty if you have none.',
      required: false,
    }),
    sensitive: mastodonProps.optionalBoolean({
      displayName: 'Mark Media as Sensitive',
      description:
        'Hide attached media behind a sensitive-content warning. Leave empty to use your account default.',
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
