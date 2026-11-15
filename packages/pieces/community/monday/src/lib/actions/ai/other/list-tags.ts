import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { mondayClient } from '../../../common/client';
import { mondayApi } from '../../../common/monday-api';
import { listTagsActionOutputSchema } from '../../../output-schemas';

export const listTagsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'Lists public tags in the account, or the tags of a private or shareable board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List monday.com tags (ID, name, color). Without a board ID it returns the account\'s public tags; with a board ID it returns the tags stored on that private or shareable board. Use to resolve tag IDs before writing a tags column; to create a missing tag use Create or Get Tag. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listTagsActionOutputSchema,
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'Only for private or shareable boards: return that board\'s tags. Resolve it with List Boards.',
      required: false,
    }),
    tag_ids: Property.Array({
      displayName: 'Tag IDs',
      description: 'Only return these public tag IDs.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id } = context.propsValue;
    const tagIds = mondayApi.toStringArray(context.propsValue.tag_ids);

    const rawTags = board_id
      ? await listBoardTags({ client: makeClient(context.auth), boardId: board_id })
      : await listPublicTags({ client: makeClient(context.auth), tagIds });

    const tags = rawTags.map((tag) => ({
      id: String(tag.id),
      name: tag.name,
      color: tag.color ?? null,
    }));

    return { tags, count: tags.length };
  },
});

async function listPublicTags({ client, tagIds }: { client: mondayClient; tagIds: string[] }): Promise<MondayTag[]> {
  const data = await client.query<{ tags: MondayTag[] | null }>({
    query: `query ($ids: [ID!]) {
      tags(ids: $ids) { id name color }
    }`,
    variables: { ids: tagIds.length > 0 ? tagIds : undefined },
  });
  return data.tags ?? [];
}

async function listBoardTags({ client, boardId }: { client: mondayClient; boardId: string }): Promise<MondayTag[]> {
  const data = await client.query<{ boards: { tags: MondayTag[] | null }[] | null }>({
    query: `query ($ids: [ID!]) {
      boards(ids: $ids) { tags { id name color } }
    }`,
    variables: { ids: [boardId] },
  });
  return (data.boards ?? [])[0]?.tags ?? [];
}

type MondayTag = {
  id: number | string;
  name: string;
  color: string | null;
};
