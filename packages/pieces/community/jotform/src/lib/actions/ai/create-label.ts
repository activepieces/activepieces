import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformCreateLabelOutputSchema } from '../../output-schemas';

export const createLabel = createAction({
  auth: jotformAuth,
  name: 'jotform_create_label',
  outputSchema: jotformCreateLabelOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Label',
  description: 'Create a new label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new label with a name, optional color and optional parent label. Returns the new label ID. Not idempotent — each call creates a new label.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the new label.',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'The label color, e.g. "#FF0000".',
      required: false,
    }),
    parentId: Property.ShortText({
      displayName: 'Parent Label ID',
      description: 'The ID of the parent label, to nest this label inside it.',
      required: false,
    }),
  },
  async run(context) {
    const { name, color, parentId } = context.propsValue;
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: '/label',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: {
        name,
        ...(color !== undefined ? { color } : {}),
        ...(parentId !== undefined ? { parent: parentId } : {}),
      },
    });
  },
});
