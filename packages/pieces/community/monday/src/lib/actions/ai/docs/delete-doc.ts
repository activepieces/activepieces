import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { deleteDocActionOutputSchema } from '../../../output-schemas';

export const deleteDocAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_doc',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Doc',
  description: 'Deletes a monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a monday.com doc by its internal doc ID, removing all of its content. Only use when the user explicitly asks to delete the doc. Not idempotent: a retry on an already-deleted doc errors.',
    idempotent: false,
  },
  outputSchema: deleteDocActionOutputSchema,
  props: {
    doc_id: mondayAiProps.docId(),
  },
  async run(context) {
    const { doc_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ delete_doc: unknown }>({
      query: `mutation ($docId: ID!) {
        delete_doc(docId: $docId)
      }`,
      variables: { docId: doc_id },
    });

    return {
      doc_id,
      deleted: true,
      result: mondayApi.toJsonString(data.delete_doc),
    };
  },
});
