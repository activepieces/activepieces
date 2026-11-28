import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { listIdeasOutputSchema } from '../../common/output-schemas';

export const listIdeas = createAction({
  auth: bufferAuth,
  name: 'list_ideas',
  classification: 'SEARCH',
  displayName: 'List Ideas',
  description: 'List the saved ideas in a Buffer organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists saved ideas (content concepts not yet tied to a channel) in one Buffer organization, with title, text, media, tags, target services, target date and board column. Filter by Group IDs from List Idea Groups, by grouped/ungrouped, or by Tag IDs. Returns one page; when hasNextPage is true, call again with nextCursor and the same filters. createdAt and updatedAt are Unix seconds. Read-only.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The organization ID from List Organizations.',
      required: true,
    }),
    groupIds: Property.Array({
      displayName: 'Group IDs',
      description: 'Only ideas in these board columns (IDs from List Idea Groups). Do not combine with Board Column.',
      required: false,
    }),
    membership: Property.StaticDropdown<string, false>({
      displayName: 'Board Column',
      description: 'grouped: only ideas in a column. ungrouped: only ideas outside every column. Leave empty for all. Do not combine with Group IDs.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'In a column', value: 'grouped' },
          { label: 'Not in a column', value: 'ungrouped' },
        ],
      },
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'Only ideas carrying any of these tags (IDs from List Tags).',
      required: false,
    }),
    includeUntagged: bufferAiProps.yesNoDropdown({
      displayName: 'Include Untagged',
      description: 'With Tag IDs: yes to also return ideas that have no tags. Default no.',
    }),
    limit: bufferAiProps.limitProp(),
    cursor: bufferAiProps.cursorProp(),
  },
  outputSchema: listIdeasOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const organizationId = bufferAiProps.requiredId({ value: p.organizationId, label: 'Organization ID' });
    const groups = bufferAiProps.idList({ value: p.groupIds, label: 'Group IDs' });
    const membership = bufferAiProps.oneOf({ value: p.membership, allowed: MEMBERSHIPS, label: 'Board Column' });
    if (groups !== undefined && membership !== undefined) {
      throw new Error('Give either Group IDs or Board Column, not both. Buffer accepts only one group filter.');
    }
    const tagIds = bufferAiProps.idList({ value: p.tagIds, label: 'Tag IDs' });
    const includeUntagged = bufferAiProps.yes(p.includeUntagged);
    if (includeUntagged && tagIds === undefined) {
      throw new Error('Include Untagged only works together with Tag IDs.');
    }
    const first = bufferAiProps.pageSize(p.limit);
    const after = bufferAiProps.textOf(p.cursor);

    const input: Record<string, unknown> = { organizationId };
    if (groups !== undefined || membership !== undefined) {
      input['groupFilter'] = {
        ...(groups === undefined ? {} : { groups }),
        ...(membership === undefined ? {} : { membership }),
      };
    }
    if (tagIds !== undefined) {
      input['tagsFilter'] = { in: tagIds, isEmpty: includeUntagged };
    }

    const data = await bufferClient.graphql<{
      ideas: { edges: Array<{ node: Record<string, unknown> }>; pageInfo: { endCursor?: string | null; hasNextPage: boolean } };
    }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.IDEAS,
      variables: { input, first, ...(after === undefined ? {} : { after }) },
      operation: 'list ideas',
    });
    const hasNextPage = data.ideas.pageInfo.hasNextPage;
    return {
      ideas: data.ideas.edges.map((edge) => edge.node),
      nextCursor: hasNextPage ? data.ideas.pageInfo.endCursor ?? null : null,
      hasNextPage,
    };
  },
});

const MEMBERSHIPS = ['grouped', 'ungrouped'] as const;
