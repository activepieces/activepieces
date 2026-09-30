import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformDeleteFormOutputSchema } from '../../output-schemas';

export const deleteForm = createAction({
  auth: jotformAuth,
  name: 'jotform_delete_form',
  outputSchema: jotformDeleteFormOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Form',
  description: 'Move a form to the trash.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Moves a form to the connected account's trash. Recoverable from the Jotform UI, not a hard delete. Pairs with Create Form. Re-deleting an already-trashed form is a no-op.",
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form to delete, from List Forms.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.DELETE,
      path: `/form/${context.propsValue.formId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
