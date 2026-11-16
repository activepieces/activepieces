import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { BUFFER_ENUMS, bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { listPostsOutputSchema } from '../../common/output-schemas';

export const listPosts = createAction({
  auth: bufferAuth,
  name: 'list_posts',
  classification: 'SEARCH',
  displayName: 'List Posts',
  description: 'Search the posts of a Buffer organization by status, channel, tag and date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches posts in one Buffer organization, filtered by status (draft, needs_approval, scheduled, sending, sent, error), channels, tags and scheduled/created time windows, sorted by createdAt or dueAt. Each post includes its Post ID and allowedActions (check for updatePost or deletePost before Edit a Post or Delete a Post). Returns one page; when hasNextPage is true, call again with nextCursor and the same filters. Set Include Metrics to yes only when analytics are needed, since it makes the response much larger. Read-only.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The organization ID from List Organizations.',
      required: true,
    }),
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Only posts with any of these statuses. Leave empty for all.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Needs approval', value: 'needs_approval' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Sending', value: 'sending' },
          { label: 'Sent', value: 'sent' },
          { label: 'Error', value: 'error' },
        ],
      },
    }),
    channelIds: Property.Array({
      displayName: 'Channel IDs',
      description: 'Only posts on these channels (IDs from List Channels). Leave empty for all channels.',
      required: false,
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'Only posts carrying any of these tags (IDs from List Tags).',
      required: false,
    }),
    dueAfter: Property.ShortText({
      displayName: 'Scheduled After',
      description: 'Only posts scheduled at or after this time, ISO 8601 with a timezone, e.g. 2026-12-01T00:00:00Z.',
      required: false,
    }),
    dueBefore: Property.ShortText({
      displayName: 'Scheduled Before',
      description: 'Only posts scheduled at or before this time, ISO 8601 with a timezone.',
      required: false,
    }),
    createdAfter: Property.ShortText({
      displayName: 'Created After',
      description: 'Only posts created at or after this time, ISO 8601 with a timezone.',
      required: false,
    }),
    createdBefore: Property.ShortText({
      displayName: 'Created Before',
      description: 'Only posts created at or before this time, ISO 8601 with a timezone.',
      required: false,
    }),
    sortBy: Property.StaticDropdown<string, false>({
      displayName: 'Sort By',
      description: 'createdAt (default) or dueAt (the scheduled time).',
      required: false,
      defaultValue: 'createdAt',
      options: {
        disabled: false,
        options: [
          { label: 'Created time', value: 'createdAt' },
          { label: 'Scheduled time', value: 'dueAt' },
        ],
      },
    }),
    sortDirection: Property.StaticDropdown<string, false>({
      displayName: 'Sort Direction',
      description: 'desc (newest first, default) or asc.',
      required: false,
      defaultValue: 'desc',
      options: {
        disabled: false,
        options: [
          { label: 'Newest first', value: 'desc' },
          { label: 'Oldest first', value: 'asc' },
        ],
      },
    }),
    includeMetrics: bufferAiProps.yesNoDropdown({
      displayName: 'Include Metrics',
      description: 'yes to add per-post analytics (reach, likes, …). Default no.',
    }),
    limit: bufferAiProps.limitProp(),
    cursor: bufferAiProps.cursorProp(),
  },
  outputSchema: listPostsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const organizationId = bufferAiProps.requiredId({ value: p.organizationId, label: 'Organization ID' });
    const statuses = bufferAiProps.manyOf({ value: p.status, allowed: BUFFER_ENUMS.POST_STATUSES, label: 'Status' });
    const channelIds = bufferAiProps.idList({ value: p.channelIds, label: 'Channel IDs' });
    const tagIds = bufferAiProps.idList({ value: p.tagIds, label: 'Tag IDs' });
    const dueAt = windowOf({
      start: bufferAiProps.isoDate({ value: p.dueAfter, label: 'Scheduled After', future: false }),
      end: bufferAiProps.isoDate({ value: p.dueBefore, label: 'Scheduled Before', future: false }),
    });
    const createdAt = windowOf({
      start: bufferAiProps.isoDate({ value: p.createdAfter, label: 'Created After', future: false }),
      end: bufferAiProps.isoDate({ value: p.createdBefore, label: 'Created Before', future: false }),
    });
    const sortField = bufferAiProps.oneOf({ value: p.sortBy, allowed: BUFFER_ENUMS.SORT_FIELDS, label: 'Sort By' }) ?? 'createdAt';
    const direction = bufferAiProps.oneOf({ value: p.sortDirection, allowed: BUFFER_ENUMS.SORT_DIRECTIONS, label: 'Sort Direction' }) ?? 'desc';
    const first = bufferAiProps.pageSize(p.limit);
    const after = bufferAiProps.textOf(p.cursor);

    const filter: Record<string, unknown> = {};
    if (statuses !== undefined) filter['status'] = statuses;
    if (channelIds !== undefined) filter['channelIds'] = channelIds;
    if (tagIds !== undefined) filter['tags'] = { in: tagIds };
    if (dueAt !== undefined) filter['dueAt'] = dueAt;
    if (createdAt !== undefined) filter['createdAt'] = createdAt;

    const data = await bufferClient.graphql<{
      posts: { edges?: Array<{ node: Record<string, unknown> }> | null; pageInfo: { endCursor?: string | null; hasNextPage: boolean } };
    }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.POSTS,
      variables: {
        input: {
          organizationId,
          ...(Object.keys(filter).length === 0 ? {} : { filter }),
          sort: [{ field: sortField, direction }],
        },
        first,
        ...(after === undefined ? {} : { after }),
        withMetrics: bufferAiProps.yes(p.includeMetrics),
      },
      operation: 'list posts',
    });
    const hasNextPage = data.posts.pageInfo.hasNextPage;
    return {
      posts: (data.posts.edges ?? []).map((edge) => edge.node),
      nextCursor: hasNextPage ? data.posts.pageInfo.endCursor ?? null : null,
      hasNextPage,
    };
  },
});

function windowOf({ start, end }: { start: string | undefined; end: string | undefined }): { start?: string; end?: string } | undefined {
  if (start === undefined && end === undefined) return undefined;
  if (start !== undefined && end !== undefined && Date.parse(start) > Date.parse(end)) {
    throw new Error('The "after" time must be earlier than the "before" time.');
  }
  return {
    ...(start === undefined ? {} : { start }),
    ...(end === undefined ? {} : { end }),
  };
}
