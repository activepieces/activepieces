import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteCardOutputSchema } from '../../output-schemas';

export const deleteCardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_card',
  outputSchema: metabaseDeleteCardOutputSchema,
  displayName: 'Delete Card',
  description: 'Permanently delete a saved question, model or metric.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a question (card); this cannot be undone. To move it to the trash instead (recoverable), use Update Card with Archived = Yes.',
    idempotent: false,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteCard({ auth, cardId: propsValue.cardId });
    return { deleted: true, cardId: propsValue.cardId };
  },
});
