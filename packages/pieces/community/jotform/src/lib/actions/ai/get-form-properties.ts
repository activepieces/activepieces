import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetFormPropertiesOutputSchema } from '../../output-schemas';

export const getFormProperties = createAction({
  auth: jotformAuth,
  name: 'jotform_get_form_properties',
  outputSchema: jotformGetFormPropertiesOutputSchema,
  classification: 'READ',
  displayName: 'Get Form Properties',
  description: "Get all of a form's properties.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns all of a form's properties as a key/value map: title, height, theme and style settings.",
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
      path: `/form/${context.propsValue.formId}/properties`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
