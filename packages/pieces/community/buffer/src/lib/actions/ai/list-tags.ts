import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { listTagsOutputSchema } from '../../common/output-schemas';

export const listTags = createAction({
  auth: bufferAuth,
  name: 'list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'List the tags of a Buffer organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tags of one Buffer organization, sorted by name, with their Tag IDs. Use the IDs to file posts with Create a Post or Edit a Post, or to filter List Posts, List Ideas and Get Post Metrics. Returns one page; when hasNextPage is true, call again with nextCursor. Read-only.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The organization ID from List Organizations.',
      required: true,
    }),
    limit: bufferAiProps.limitProp(),
    cursor: bufferAiProps.cursorProp(),
  },
  outputSchema: listTagsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const organizationId = bufferAiProps.requiredId({ value: p.organizationId, label: 'Organization ID' });
    const first = bufferAiProps.pageSize(p.limit);
    const after = bufferAiProps.textOf(p.cursor);
    const data = await bufferClient.graphql<{
      tagsV2: { totalCount: number; edges: Array<{ node: Record<string, unknown> }>; pageInfo: { endCursor?: string | null; hasNextPage: boolean } };
    }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.TAGS,
      variables: { input: { organizationId }, first, ...(after === undefined ? {} : { after }) },
      operation: 'list tags',
    });
    const hasNextPage = data.tagsV2.pageInfo.hasNextPage;
    return {
      tags: data.tagsV2.edges.map((edge) => edge.node),
      totalCount: data.tagsV2.totalCount,
      nextCursor: hasNextPage ? data.tagsV2.pageInfo.endCursor ?? null : null,
      hasNextPage,
    };
  },
});
