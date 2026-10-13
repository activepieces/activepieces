import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { duplicateGroupActionOutputSchema } from '../../../output-schemas';

export const duplicateGroupAction = createAction({
  auth: mondayAuth,
  name: 'monday_duplicate_group',
  classification: 'WRITE',
  displayName: 'Duplicate Group',
  description: 'Duplicates a group with its items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Duplicate a monday.com group, including its items, on the same board, optionally with a new title and placed at the top. Limited by monday.com to 40 duplications per minute. Each call creates another copy, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: duplicateGroupActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    group_id: mondayAiProps.groupId(true),
    group_title: Property.ShortText({
      displayName: 'New Group Title',
      description: 'Title for the copy. Defaults to the original title with a "Duplicate of" prefix.',
      required: false,
    }),
    add_to_top: Property.Checkbox({
      displayName: 'Add To Top',
      description: 'Place the copy at the top of the board.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, group_id, group_title, add_to_top } = context.propsValue;

    const data = await makeClient(context.auth).query<{ duplicate_group: { id: string; title: string; color: string } }>({
      query: `mutation ($boardId: ID!, $groupId: String!, $addToTop: Boolean, $groupTitle: String) {
        duplicate_group(board_id: $boardId, group_id: $groupId, add_to_top: $addToTop, group_title: $groupTitle) { id title color }
      }`,
      variables: {
        boardId: board_id,
        groupId: group_id,
        addToTop: add_to_top ?? false,
        ...(isNil(group_title) ? {} : { groupTitle: group_title }),
      },
    });

    const group = data.duplicate_group;
    return { id: group.id, board_id, source_group_id: group_id, title: group.title, color: group.color };
  },
});
