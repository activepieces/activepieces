import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { postItemUpdateActionOutputSchema } from '../../../output-schemas';

export const postItemUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_post_item_update',
  classification: 'WRITE',
  displayName: 'Post Item Update',
  description: 'Posts an update on an item, or a reply to an existing update.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Post a new update (comment) to a monday.com item, or reply to an existing update by passing its Parent Update ID instead of the item. Body accepts HTML. Use Edit Update to change an existing update. Each call posts a new update, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: postItemUpdateActionOutputSchema,
  props: {
    item_id: mondayAiProps.itemId(false),
    parent_id: Property.ShortText({
      displayName: 'Parent Update ID',
      description: 'Set to reply to an existing update (from List Item Updates). Leave empty to post a top-level update on the item.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The update text. HTML is supported.',
      required: true,
    }),
  },
  async run(context) {
    const { item_id, parent_id, body } = context.propsValue;
    if (isNil(item_id) && isNil(parent_id)) {
      throw new Error('Provide an Item ID to post an update, or a Parent Update ID to reply.');
    }

    const data = await makeClient(context.auth).query<{ create_update: MondayUpdate }>({
      query: `mutation ($itemId: ID, $parentId: ID, $body: String!) {
        create_update(item_id: $itemId, parent_id: $parentId, body: $body) {
          id
          body
          text_body
          item_id
          creator_id
          created_at
        }
      }`,
      variables: {
        ...(isNil(item_id) ? {} : { itemId: item_id }),
        ...(isNil(parent_id) ? {} : { parentId: parent_id }),
        body,
      },
    });

    const update = data.create_update;
    return {
      id: update.id,
      item_id: update.item_id ?? null,
      parent_id: parent_id ?? null,
      body: update.body,
      text_body: update.text_body ?? null,
      creator_id: update.creator_id ?? null,
      created_at: update.created_at ?? null,
    };
  },
});

type MondayUpdate = {
  id: string;
  body: string;
  text_body: string | null;
  item_id: string | null;
  creator_id: string | null;
  created_at: string | null;
};
