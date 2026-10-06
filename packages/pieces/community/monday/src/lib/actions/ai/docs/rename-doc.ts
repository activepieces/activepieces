import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { renameDocActionOutputSchema } from '../../../output-schemas';

export const renameDocAction = createAction({
  auth: mondayAuth,
  name: 'monday_rename_doc',
  classification: 'WRITE',
  displayName: 'Rename Doc',
  description: 'Changes the name of a monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename an existing monday.com doc by its internal doc ID. Only changes the title, never the content. Safe to retry: re-applying the same name leaves the doc unchanged.',
    idempotent: true,
  },
  outputSchema: renameDocActionOutputSchema,
  props: {
    doc_id: mondayAiProps.docId(),
    name: Property.ShortText({
      displayName: 'New Name',
      required: true,
    }),
  },
  async run(context) {
    const { doc_id, name } = context.propsValue;
    const data = await makeClient(context.auth).query<{ update_doc_name: unknown }>({
      query: `mutation ($docId: ID!, $name: String!) {
        update_doc_name(docId: $docId, name: $name)
      }`,
      variables: { docId: doc_id, name },
    });

    return {
      doc_id,
      name,
      result: mondayApi.toJsonString(data.update_doc_name),
    };
  },
});
