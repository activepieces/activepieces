import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteCardOutputSchema } from '../../output-schemas';

export const deleteCardPublicLinkAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_card_public_link',
  outputSchema: metabaseDeleteCardOutputSchema,
  displayName: 'Delete Card Public Link',
  description: 'Turn off the public link of a saved question.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      "Disables a question's public link so it no longer opens without login. A new link from Create Card Public Link gets a different UUID. Needs an admin key.",
    idempotent: false,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteCardPublicLink({ auth, cardId: propsValue.cardId });
    return { deleted: true, cardId: propsValue.cardId };
  },
});
