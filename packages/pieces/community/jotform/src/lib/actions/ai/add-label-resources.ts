import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformAddLabelResourcesOutputSchema } from '../../output-schemas';

export const addLabelResources = createAction({
  auth: jotformAuth,
  name: 'jotform_add_label_resources',
  outputSchema: jotformAddLabelResourcesOutputSchema,
  classification: 'WRITE',
  displayName: 'Add Label Resources',
  description: 'Attach resources (forms, workflows, sheets, portals) to a label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Attaches resources to a label from a JSON array of {"id":"...","type":"FORM"} entries. Idempotent — re-attaching an already-attached resource is a no-op.',
    idempotent: true,
  },
  props: {
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label, from List Labels.',
      required: true,
    }),
    resources: Property.Json({
      displayName: 'Resources',
      description:
        'JSON array of resources to attach, e.g. [{"id":"123","type":"FORM"}].',
      required: true,
    }),
  },
  async run(context) {
    const { labelId, resources } = context.propsValue;
    if (!Array.isArray(resources) || resources.length === 0) {
      throw new Error('resources must be a non-empty array.');
    }
    return jotformCommon.request({
      method: HttpMethod.PUT,
      path: `/label/${labelId}/add-resources`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: { resources },
    });
  },
});
