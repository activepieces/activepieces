import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { createOrGetTagActionOutputSchema } from '../../../output-schemas';

export const createOrGetTagAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_or_get_tag',
  classification: 'WRITE',
  displayName: 'Create or Get Tag',
  description: 'Creates a tag, or returns it if a tag with that name already exists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return the monday.com tag with the given name, creating it first if it does not exist, and give back its ID for use in a tags column value ({"tag_ids":[id]}). Pass a board ID only for private or shareable boards; omit it for a public tag. A new tag only shows in the UI once it is used. Safe to retry: the same name returns the same tag.',
    idempotent: true,
  },
  outputSchema: createOrGetTagActionOutputSchema,
  props: {
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      required: true,
    }),
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'Only for private or shareable boards. Leave empty to create a public tag.',
      required: false,
    }),
  },
  async run(context) {
    const { tag_name, board_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_or_get_tag: { id: number | string; name: string; color: string | null } | null }>({
      query: `mutation ($tagName: String, $boardId: ID) {
        create_or_get_tag(tag_name: $tagName, board_id: $boardId) { id name color }
      }`,
      variables: {
        tagName: tag_name,
        boardId: board_id || undefined,
      },
    });

    const tag = data.create_or_get_tag;
    if (!tag) {
      throw new Error('monday.com did not return the tag.');
    }

    return {
      id: String(tag.id),
      name: tag.name,
      color: tag.color ?? null,
    };
  },
});
