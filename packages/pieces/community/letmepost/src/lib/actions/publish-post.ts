import { createAction, Property } from '@activepieces/pieces-framework';
import { letmepostAuth } from '../common/auth';
import { letmepostCommon } from '../common';
import { letmepostClient } from '../common/client';
import { publishPostOutputSchema } from '../common/output-schemas';

export const publishPost = createAction({
  auth: letmepostAuth,
  name: 'publish_post',
  classification: 'WRITE',
  displayName: 'Publish a Post',
  description: 'Publish or schedule a post to one or more connected accounts',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends one body of text and optional media to one or more connected accounts in a single call, either immediately (Publish now on) or at the Schedule at time (Publish now off); setting both is an error. Fails when every target fails; on a partial failure it returns per-target results, and results[].postId (or postIds) identifies each per-account post. Not idempotent unless an Idempotency Key is supplied, in which case replays within 24 hours return the original result.',
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
    media: letmepostCommon.mediaProperty(),
    firstComment: Property.LongText({
      displayName: 'First comment',
      description:
        'Posted as the first comment under the published post, where the platform supports it. Not allowed on scheduled posts.',
      required: false,
    }),
    publishNow: Property.Checkbox({
      displayName: 'Publish now',
      description:
        'Publish immediately. Turn off to schedule for a future time with Schedule at.',
      required: false,
      defaultValue: true,
    }),
    scheduledAt: Property.DateTime({
      displayName: 'Schedule at',
      description:
        'When to publish the post (ISO 8601). Used only when Publish now is off; the step fails if both are set.',
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
        'Reusing the same key never publishes twice, which makes retries safe (up to 128 characters, remembered for 24 hours).',
      required: false,
    }),
    pinterestBoardId: Property.ShortText({
      displayName: 'Pinterest board ID',
      description:
        'Board to pin to on Pinterest accounts. Leave empty to use the account default board. Find ids with List Pinterest Boards.',
      required: false,
    }),
    pinterestTitle: Property.ShortText({
      displayName: 'Pinterest pin title',
      description: 'Title of the pin. Applied to Pinterest accounts only.',
      required: false,
    }),
    pinterestDestinationUrl: Property.ShortText({
      displayName: 'Pinterest destination URL',
      description: 'Outbound link attached to the pin. Applied to Pinterest accounts only.',
      required: false,
    }),
    pinterestCoverImageUrl: Property.ShortText({
      displayName: 'Pinterest cover image URL',
      description: 'Cover image for video pins. Applied to Pinterest accounts only.',
      required: false,
    }),
  },
  outputSchema: publishPostOutputSchema,
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
      pinterestBoardId,
      pinterestTitle,
      pinterestDestinationUrl,
      pinterestCoverImageUrl,
    } = context.propsValue;

    const publishImmediately = publishNow ?? true;
    const scheduleAt = letmepostClient.optionalText(scheduledAt);

    if (publishImmediately && scheduleAt !== undefined) {
      throw new Error(
        'Publish now is on and Schedule at is set. Turn Publish now off to schedule the post, or clear Schedule at to publish immediately.'
      );
    }
    if (!publishImmediately && scheduleAt === undefined) {
      throw new Error(
        'A Schedule at time is required when Publish now is turned off.'
      );
    }
    return letmepostCommon.publishToAccounts({
      auth: context.auth,
      accountIds: Array.isArray(accounts) ? accounts : [],
      text,
      media,
      firstComment,
      scheduledAt: publishImmediately ? undefined : scheduleAt,
      profileId,
      idempotencyKey: idempotencyKey ?? undefined,
      pinterest: {
        boardId: pinterestBoardId,
        title: pinterestTitle,
        destinationUrl: pinterestDestinationUrl,
        coverImageUrl: pinterestCoverImageUrl,
      },
    });
  },
});
