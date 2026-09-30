import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { editUpdateActionOutputSchema } from '../../../output-schemas';

export const editUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_edit_update',
  classification: 'WRITE',
  displayName: 'Edit Update',
  description: 'Replaces the text of an existing update.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replace the body of an existing monday.com update or reply with new text. Use to correct a posted comment; to add a new comment use Post Item Update. Only the update\'s author can edit it. Safe to retry with the same body.',
    idempotent: true,
  },
  outputSchema: editUpdateActionOutputSchema,
  props: {
    update_id: mondayAiProps.updateId(true),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The new update text. HTML is supported. Replaces the whole body.',
      required: true,
    }),
  },
  async run(context) {
    const { update_id, body } = context.propsValue;

    const data = await makeClient(context.auth).query<{ edit_update: MondayUpdate }>({
      query: `mutation ($id: ID!, $body: String!) {
        edit_update(id: $id, body: $body) {
          id
          body
          text_body
          item_id
          updated_at
        }
      }`,
      variables: { id: update_id, body },
    });

    const update = data.edit_update;
    return {
      id: update.id,
      item_id: update.item_id ?? null,
      body: update.body,
      text_body: update.text_body ?? null,
      updated_at: update.updated_at ?? null,
    };
  },
});

type MondayUpdate = {
  id: string;
  body: string;
  text_body: string | null;
  item_id: string | null;
  updated_at: string | null;
};
