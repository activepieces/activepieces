import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetLabelResourcesOutputSchema } from '../../output-schemas';

export const getLabelResources = createAction({
  auth: jotformAuth,
  name: 'jotform_get_label_resources',
  outputSchema: jotformGetLabelResourcesOutputSchema,
  classification: 'SEARCH',
  displayName: 'Get Label Resources',
  description: 'List the resources (forms, workflows, sheets, portals) tagged with a label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the resources tagged with a label — forms, workflows, sheets or portals — each with its ID, type and status. Idempotent — a repeated call returns the same list.',
    idempotent: true,
  },
  props: {
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label, from List Labels.',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Filter resources by status, e.g. "ENABLED".',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of resources to return.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of resources to skip, for pagination.',
      required: false,
    }),
  },
  async run(context) {
    const { labelId, status, limit, offset } = context.propsValue;
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/label/${labelId}/resources`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      queryParams: {
        ...(status !== undefined ? { status } : {}),
        ...(limit !== undefined ? { limit: String(limit) } : {}),
        ...(offset !== undefined ? { offset: String(offset) } : {}),
      },
    });
  },
});
