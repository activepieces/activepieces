import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon } from '../common';
import { deleteFormOutputSchema } from '../output-schemas';

export const deleteFormAction = createAction({
  auth: typeformAuth,
  name: 'delete_form',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Form',
  description: 'Permanently deletes a form and all of its responses.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a Typeform form together with all of its responses. Cannot be undone; confirm with the user first. To stop new responses without losing data, use Update Form with Public set to Closed instead.',
    idempotent: false,
  },
  outputSchema: deleteFormOutputSchema,
  props: {
    form_id: typeformCommon.formId,
  },
  async run({ auth, propsValue }) {
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.DELETE,
      path: `/forms/${encodeURIComponent(propsValue.form_id)}`,
    });
    return { deleted: true, form_id: propsValue.form_id };
  },
});
