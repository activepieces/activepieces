import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostApiCall, letmepostCommon } from '../common';

export const publishPost = createAction({
  auth: letmepostAuth,
  name: 'publish_post',
  displayName: 'Publish a Post',
  description: 'Publish or schedule a post to one or more connected accounts',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends one body of text and optional media to one or more connected accounts in a single call, either immediately or scheduled for a future time. Use to push content out through letmepost. A schedule time is required when Publish Now is off. Not idempotent unless an Idempotency Key is supplied, in which case replays within 24 hours return the original result.',
    idempotent: false,
  },
  props: {
    accounts: letmepostCommon.accountsDropdown,
    text: Property.LongText({
      displayName: 'Text',
      description:
        'The post body. Optional when the post is media-only on platforms that allow it.',
      required: false,
    }),
    media: Property.Array({
      displayName: 'Media',
      description:
        'Media attachments. Give each item a public URL or an existing letmepost media ID, not both.',
      required: false,
      properties: {
        kind: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'Image', value: 'image' },
              { label: 'Video', value: 'video' },
            ],
          },
        }),
        url: Property.ShortText({
          displayName: 'URL',
          description: 'Public URL of the media. Use this or Media ID.',
          required: false,
        }),
        mediaId: Property.ShortText({
          displayName: 'Media ID',
          description:
            'ID of a media asset already uploaded to letmepost. Use this or URL.',
          required: false,
        }),
        altText: Property.ShortText({
          displayName: 'Alt text',
          description: 'Accessibility description for the media.',
          required: false,
        }),
      },
    }),
    firstComment: Property.LongText({
      displayName: 'First comment',
      description:
        'Posted as the first comment under the published post, where the platform supports it.',
      required: false,
    }),
    publishNow: Property.Checkbox({
      displayName: 'Publish now',
      description:
        'Publish immediately. Turn off to schedule for a future time.',
      required: false,
      defaultValue: true,
    }),
    scheduledAt: Property.DateTime({
      displayName: 'Schedule at',
      description:
        'When to publish the post (ISO 8601). Required when Publish Now is off.',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Optional profile to attribute this post to.',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency key',
      description:
        'Reusing the same key never publishes twice, which makes retries safe.',
      required: false,
    }),
  },
  async run(context) {
    const {
      accounts,
      text,
      media,
      firstComment,
      publishNow,
      scheduledAt,
      profileId,
      idempotencyKey,
    } = context.propsValue;

    const publishImmediately = publishNow ?? true;

    if (!publishImmediately && !scheduledAt) {
      throw new Error(
        'A Schedule at time is required when Publish now is turned off.'
      );
    }

    const body: Record<string, unknown> = {
      targets: accounts.map((accountId) => ({ accountId })),
    };
    if (publishImmediately) {
      body['publishNow'] = true;
    } else {
      body['scheduledAt'] = scheduledAt;
    }

    if (text) {
      body['text'] = text;
    }
    if (media && media.length > 0) {
      body['media'] = (media as Array<Record<string, unknown>>).map((item) => {
        const cleaned: Record<string, unknown> = { kind: item['kind'] };
        if (item['url']) {
          cleaned['url'] = item['url'];
        }
        if (item['mediaId']) {
          cleaned['mediaId'] = item['mediaId'];
        }
        if (item['altText']) {
          cleaned['altText'] = item['altText'];
        }
        return cleaned;
      });
    }
    if (firstComment) {
      body['firstComment'] = { text: firstComment };
    }
    if (!publishImmediately && scheduledAt) {
      body['scheduledAt'] = scheduledAt;
    }
    if (profileId) {
      body['profileId'] = profileId;
    }

    const response = await letmepostApiCall<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/posts',
      body,
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    });

    return response.body;
  },
});
