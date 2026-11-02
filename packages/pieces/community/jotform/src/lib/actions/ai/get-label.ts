import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetLabelOutputSchema } from '../../output-schemas';

export const getLabel = createAction({
  auth: jotformAuth,
  name: 'jotform_get_label',
  outputSchema: jotformGetLabelOutputSchema,
  classification: 'READ',
  displayName: 'Get Label',
  description: 'Get a label by ID.',
  audience: 'ai',
  aiMetadata: {
    description: "Returns a single label's detail: name, color and parent label.",
    idempotent: true,
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
      method: HttpMethod.GET,
      path: `/label/${context.propsValue.labelId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
