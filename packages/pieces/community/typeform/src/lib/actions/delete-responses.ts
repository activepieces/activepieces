import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon } from '../common';
import { deleteResponsesOutputSchema } from '../output-schemas';

export const deleteResponsesAction = createAction({
  auth: typeformAuth,
  name: 'delete_responses',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Responses',
  description: 'Permanently deletes responses from a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete up to 1000 responses from a Typeform form by response ID (the response_id or token from Find Responses). Typeform deletes them in the background, so the result only means the request was accepted; unknown IDs are ignored. Check with Find Responses afterwards. Cannot be undone; confirm with the user first.',
    idempotent: false,
  },
  outputSchema: deleteResponsesOutputSchema,
  props: {
    form_id: typeformCommon.formId,
    responseIds: Property.Array({
      displayName: 'Response IDs',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = typeformCommon.toStringList({ values: propsValue.responseIds });
    if (ids.length === 0 || ids.length > 1000) {
      throw new Error('Response IDs must contain between 1 and 1000 IDs.');
    }
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.DELETE,
      path: `/forms/${encodeURIComponent(propsValue.form_id)}/responses`,
      queryParams: { included_response_ids: ids.join(',') },
    });
    return { registered: true, form_id: propsValue.form_id, response_ids: ids, count: ids.length };
  },
});
