import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformCloneFormOutputSchema } from '../../output-schemas';

export const cloneForm = createAction({
  auth: jotformAuth,
  name: 'jotform_clone_form',
  outputSchema: jotformCloneFormOutputSchema,
  classification: 'WRITE',
  displayName: 'Clone Form',
  description: 'Duplicate an existing form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a copy of an existing form, including its questions and properties, and returns the new form ID. Not idempotent — each call creates another copy.',
    idempotent: false,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form to clone, from List Forms.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: `/form/${context.propsValue.formId}/clone`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
