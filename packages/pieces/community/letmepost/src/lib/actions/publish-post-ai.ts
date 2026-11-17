import { createAction, Property } from '@activepieces/pieces-framework';
import { letmepostAuth } from '../common/auth';
import { letmepostCommon } from '../common';
import { letmepostClient } from '../common/client';
import { publishPostOutputSchema } from '../common/output-schemas';

function accountIdsOf(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const ids = raw.map((item, index) => letmepostClient.uuidOf({ value: item, label: `Account ID ${index + 1}` }));
  return Array.from(new Set(ids));
}

function scheduleOf(value: unknown): string | undefined {
  const text = letmepostClient.optionalText(value);
  if (text === undefined) return undefined;
  const match = ISO_WITH_ZONE.exec(text);
  const date = new Date(text);
  if (match === null || Number.isNaN(date.getTime()) || !isRealCalendarDay({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) })) {
    throw new Error(`Schedule at "${text.slice(0, 60)}" is not a valid ISO 8601 date and time with a timezone, like 2026-11-07T09:00:00Z. Nothing was published. Leave Schedule at empty to publish now.`);
  }
  if (date.getTime() <= Date.now()) {
    throw new Error(`Schedule at "${text.slice(0, 60)}" is not in the future. Nothing was published. Leave Schedule at empty to publish now.`);
  }
  return date.toISOString();
}

function isRealCalendarDay({ year, month, day }: { year: number; month: number; day: number }): boolean {
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
}

const ISO_WITH_ZONE = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})$/i;

export const publishPostAi = createAction({
  auth: letmepostAuth,
  name: 'publish_post_ai',
  classification: 'WRITE',
  displayName: 'Publish or Schedule a Post',
  description: 'Publish a post now, or schedule it, on one or more connected accounts',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes one text with optional media to one or more connected accounts. Leave Schedule at empty to publish now; to schedule, set it to a future ISO 8601 time with a timezone, e.g. 2026-11-07T09:00:00Z (other formats fail without publishing). Get account IDs from List Accounts (filter by platform if needed). Fails when every account fails; a partial failure returns per-account results. Use results[].postId or postIds with Get a Post, Reschedule a Post or Cancel a Scheduled Post; the top-level id is a batch id that Get a Post cannot fetch. For replies use Reply to a Post. Each call publishes again unless you pass the same Idempotency key, which makes a retry within 24 hours return the original result.',
    idempotent: false,
  },
  props: {
    accountIds: Property.Array({
      displayName: 'Account IDs',
      description: 'letmepost account ids (UUIDs) from List Accounts, one per account to publish to. At most 25.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The post body. Optional only for media-only posts on platforms that allow them.',
      required: false,
    }),
    media: letmepostCommon.mediaProperty(),
    scheduledAt: Property.ShortText({
      displayName: 'Schedule at',
      description: 'Future time to publish at, in ISO 8601 with a timezone, e.g. 2026-11-07T09:00:00Z or 2026-11-07T11:00:00+02:00. Leave empty to publish now. Any other format fails without publishing.',
      required: false,
    }),
    firstComment: Property.LongText({
      displayName: 'First comment',
      description: 'Posted as the first comment under the published post where the platform supports it. Not allowed on scheduled posts.',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Optional profile (UUID) to attribute this post to.',
      required: false,
    }),
    pinterestBoardId: Property.ShortText({
      displayName: 'Pinterest board ID',
      description: 'Pinterest accounts only: board to pin to, from List Pinterest Boards. Empty uses the account default board.',
      required: false,
    }),
    pinterestTitle: Property.ShortText({
      displayName: 'Pinterest pin title',
      description: 'Pinterest accounts only: title of the pin.',
      required: false,
    }),
    pinterestDestinationUrl: Property.ShortText({
      displayName: 'Pinterest destination URL',
      description: 'Pinterest accounts only: outbound link attached to the pin.',
      required: false,
    }),
    pinterestCoverImageUrl: Property.ShortText({
      displayName: 'Pinterest cover image URL',
      description: 'Pinterest accounts only: cover image for video pins.',
      required: false,
    }),
    idempotencyKey: Property.ShortText({
      displayName: 'Idempotency key',
      description: 'Any unique string up to 128 characters. Reusing it within 24 hours returns the first result instead of publishing again.',
      required: false,
    }),
  },
  outputSchema: publishPostOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const accountIds = accountIdsOf(p.accountIds);
    const scheduledAt = scheduleOf(p.scheduledAt);
    const profileId = letmepostClient.optionalUuid({ value: p.profileId, label: 'Profile ID' });
    return letmepostCommon.publishToAccounts({
      auth: context.auth,
      accountIds,
      text: p.text ?? undefined,
      media: p.media,
      firstComment: p.firstComment,
      scheduledAt,
      profileId,
      idempotencyKey: p.idempotencyKey ?? undefined,
      pinterest: {
        boardId: p.pinterestBoardId,
        title: p.pinterestTitle,
        destinationUrl: p.pinterestDestinationUrl,
        coverImageUrl: p.pinterestCoverImageUrl,
      },
    });
  },
});
