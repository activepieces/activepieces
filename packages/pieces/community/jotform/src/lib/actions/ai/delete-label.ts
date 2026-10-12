import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformDeleteFormQuestionOutputSchema } from '../../output-schemas';

export const deleteLabel = createAction({
  auth: jotformAuth,
  name: 'jotform_delete_label',
  outputSchema: jotformDeleteFormQuestionOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Label',
  description: 'Delete a label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a label. Pairs with Create Label. Not idempotent — deleting an already-removed label fails.',
    idempotent: false,
  },
  props: {
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label, from List Labels.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.DELETE,
      path: `/label/${context.propsValue.labelId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
