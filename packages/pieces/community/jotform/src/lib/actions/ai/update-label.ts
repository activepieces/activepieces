import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformUpdateLabelOutputSchema } from '../../output-schemas';

export const updateLabel = createAction({
  auth: jotformAuth,
  name: 'jotform_update_label',
  outputSchema: jotformUpdateLabelOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Label',
  description: "Update a label's name or color.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a label from a key/value map, e.g. {"name":"Priority"} or {"color":"#00FF00"}. Only the supplied keys change. Idempotent — setting the same value again is a no-op.',
    idempotent: true,
  },
  props: {
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label, from List Labels.',
      required: true,
    }),
    updates: Property.Json({
      displayName: 'Updates',
      description:
        'Key/value map of label properties to update, e.g. {"name":"Priority"}.',
      required: true,
    }),
  },
  async run(context) {
    const { labelId, updates } = context.propsValue;
    if (typeof updates !== 'object' || updates === null || Array.isArray(updates)) {
      throw new Error('updates must be a JSON object of key/value pairs.');
    }
    return jotformCommon.request({
      method: HttpMethod.PUT,
      path: `/label/${labelId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: updates as Record<string, unknown>,
    });
  },
});
