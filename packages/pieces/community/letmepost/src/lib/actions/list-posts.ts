import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostCommon } from '../common';
import { letmepostClient } from '../common/client';
import { listPostsOutputSchema } from '../common/output-schemas';

function limitOf(value: unknown): number {
  if (value === undefined || value === null || value === '') return 50;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 200) {
    throw new Error('Limit must be a whole number from 1 to 200.');
  }
  return number;
}

function listOf(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
    .map((item) => item.trim())
    .filter((item) => item !== '');
  return items.length === 0 ? undefined : items;
}

function isoOf({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = letmepostClient.optionalText(value);
  if (text === undefined) return undefined;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid date and time.`);
  }
  return date.toISOString();
}

export const listPosts = createAction({
  auth: letmepostAuth,
  name: 'list_posts',
  classification: 'SEARCH',
  displayName: 'List Posts',
  description: 'Search the post log with filters, newest first',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists per-account posts newest first (by creation time), filtered by status, platform, text, creation date range, profile or error code. Returns one page plus nextCursor; pass nextCursor back as Cursor with the same filters to get the next page. Use to find post ids for Get a Post, Reschedule a Post or Cancel a Scheduled Post. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Only posts in these states. Leave empty for all.',
      required: false,
      options: { options: letmepostCommon.POST_STATUS_OPTIONS },
    }),
    platform: Property.StaticMultiSelectDropdown({
      displayName: 'Platform',
      description: 'Only posts on these platforms. Leave empty for all.',
      required: false,
      options: { options: letmepostCommon.PLATFORM_OPTIONS },
    }),
    q: Property.ShortText({
      displayName: 'Text contains',
      description: 'Case-insensitive text to find in the post body (up to 200 characters).',
      required: false,
    }),
    after: Property.DateTime({
      displayName: 'Created after',
      description: 'Only posts created after this time.',
      required: false,
    }),
    before: Property.DateTime({
      displayName: 'Created before',
      description: 'Only posts created before this time.',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Only posts in this profile.',
      required: false,
    }),
    errorCode: Property.ShortText({
      displayName: 'Error code',
      description: 'Only failed posts with this error code, for example platform_rejected. Separate several codes with commas.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Posts per page, 1 to 200. Default 50.',
      required: false,
      defaultValue: 50,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The Next Cursor value from a previous List Posts run, to get the next page. Keep the other filters the same.',
      required: false,
    }),
  },
  outputSchema: listPostsOutputSchema,
  async run(context) {
    const { status, platform, q, after, before, profileId, errorCode, limit, cursor } = context.propsValue;
    const search = letmepostClient.optionalText(q);
    if (search !== undefined && search.length > 200) {
      throw new Error('Text contains must be 200 characters or fewer.');
    }
    const body = await letmepostClient.request<{ data?: unknown; nextCursor?: unknown }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/posts',
      query: {
        status: listOf(status),
        platform: listOf(platform),
        errorCode: listOf(errorCode === undefined || errorCode === null ? undefined : [errorCode]),
        q: search,
        after: isoOf({ value: after, label: 'Created after' }),
        before: isoOf({ value: before, label: 'Created before' }),
        profileId: letmepostClient.optionalText(profileId),
        limit: limitOf(limit),
        cursor: letmepostClient.optionalText(cursor),
      },
      operation: 'list posts',
    });
    return {
      data: Array.isArray(body?.data) ? body.data : [],
      nextCursor: letmepostClient.optionalText(body?.nextCursor) ?? null,
    };
  },
});
