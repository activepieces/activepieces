import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateSnippetOutputSchema } from '../../output-schemas';

export const updateSnippetAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_snippet',
  outputSchema: metabaseUpdateSnippetOutputSchema,
  displayName: 'Update Snippet',
  description: 'Change or archive a SQL snippet.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a SQL snippet; renaming breaks questions that reference the old name. Archived = Yes hides it (recoverable).',
    idempotent: true,
  },
  props: {
    snippetId: metabaseAiProps.snippetId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'SQL',
      description: 'New SQL fragment. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes archives the snippet, No restores it. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateSnippet({
      auth,
      snippetId: propsValue.snippetId,
      body: {
        name: propsValue.name,
        content: propsValue.content,
        description: propsValue.description,
        archived: propsValue.archived,
      },
    });
  },
});
