import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { mondayClient } from '../../../common/client';
import { mondayAiProps } from '../../../common/ai-props';
import { updateGroupActionOutputSchema } from '../../../output-schemas';

export const updateGroupAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_group',
  classification: 'WRITE',
  displayName: 'Update Group',
  description: 'Renames, recolors or repositions a group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change a monday.com group\'s title and/or color, or move it before or after another group. Only the fields you provide change. Resolve group IDs with List Groups. Re-applying the same values is safe.',
    idempotent: true,
  },
  outputSchema: updateGroupActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    group_id: mondayAiProps.groupId(true),
    title: Property.ShortText({
      displayName: 'New Title',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'New Color',
      description: 'monday.com group color name or HEX value.',
      required: false,
    }),
    move_after_group_id: Property.ShortText({
      displayName: 'Move After Group ID',
      description: 'Move the group directly after this group ID.',
      required: false,
    }),
    move_before_group_id: Property.ShortText({
      displayName: 'Move Before Group ID',
      description: 'Move the group directly before this group ID.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id, group_id, title, color, move_after_group_id, move_before_group_id } = context.propsValue;
    const changes = [
      { attribute: 'title', value: title },
      { attribute: 'color', value: color },
      { attribute: 'relative_position_after', value: move_after_group_id },
      { attribute: 'relative_position_before', value: move_before_group_id },
    ].filter((change): change is { attribute: string; value: string } => !isNil(change.value));

    if (changes.length === 0) {
      throw new Error('Provide at least one of New Title, New Color, Move After Group ID or Move Before Group ID.');
    }
    if (!isNil(move_after_group_id) && !isNil(move_before_group_id)) {
      throw new Error('Provide either Move After Group ID or Move Before Group ID, not both.');
    }

    const results = await applyChanges({ client: makeClient(context.auth), boardId: board_id, groupId: group_id, changes });
    const group = results[results.length - 1];

    return {
      id: group?.id ?? group_id,
      board_id,
      title: group?.title ?? null,
      color: group?.color ?? null,
      updated_attributes: changes.map((change) => change.attribute).join(', '),
    };
  },
});

async function applyChanges({
  client,
  boardId,
  groupId,
  changes,
}: {
  client: mondayClient;
  boardId: string | undefined;
  groupId: string | undefined;
  changes: { attribute: string; value: string }[];
}): Promise<MondayGroup[]> {
  return changes.reduce<Promise<MondayGroup[]>>(async (previous, change) => {
    const done = await previous;
    const data = await client.query<{ update_group: MondayGroup }>({
      query: `mutation ($boardId: ID!, $groupId: String!, $attribute: GroupAttributes!, $value: String!) {
        update_group(board_id: $boardId, group_id: $groupId, group_attribute: $attribute, new_value: $value) { id title color }
      }`,
      variables: { boardId, groupId, attribute: change.attribute, value: change.value },
    });
    return [...done, data.update_group];
  }, Promise.resolve([]));
}

type MondayGroup = {
  id: string;
  title: string;
  color: string;
};
