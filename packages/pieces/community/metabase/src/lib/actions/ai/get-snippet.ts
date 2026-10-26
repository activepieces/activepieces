import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateSnippetOutputSchema } from '../../output-schemas';

export const getSnippetAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_snippet',
  outputSchema: metabaseUpdateSnippetOutputSchema,
  displayName: 'Get Snippet',
  description: 'Get a SQL snippet by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one SQL snippet with its name, content and collection.',
    idempotent: true,
  },
  props: {
    snippetId: metabaseAiProps.snippetId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getSnippet({
      auth,
      snippetId: propsValue.snippetId,
    });
  },
});
