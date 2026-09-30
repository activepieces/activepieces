import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetFormOutputSchema } from '../../output-schemas';

export const getForm = createAction({
  auth: jotformAuth,
  name: 'jotform_get_form',
  outputSchema: jotformGetFormOutputSchema,
  classification: 'READ',
  displayName: 'Get Form',
  description: "Get a single form's metadata.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns a form's metadata: title, status, height and URL. Use List Forms to find the form ID.",
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/form/${context.propsValue.formId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
