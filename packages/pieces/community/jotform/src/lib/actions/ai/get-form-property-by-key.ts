import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetFormPropertyByKeyOutputSchema } from '../../output-schemas';

export const getFormPropertyByKey = createAction({
  auth: jotformAuth,
  name: 'jotform_get_form_property_by_key',
  outputSchema: jotformGetFormPropertyByKeyOutputSchema,
  classification: 'READ',
  displayName: 'Get Form Property by Key',
  description: "Get a single form property's value by its key.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the value of a single form property by its key, e.g. "title". Resolve the available keys with Get Form Properties.',
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    propertyKey: Property.ShortText({
      displayName: 'Property Key',
      description: 'The property key to read, e.g. "title".',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/form/${context.propsValue.formId}/properties/${context.propsValue.propertyKey}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
