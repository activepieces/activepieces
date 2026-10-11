import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformListFormsOutputSchema } from '../../output-schemas';

export const listForms = createAction({
  auth: jotformAuth,
  name: 'jotform_list_forms',
  outputSchema: jotformListFormsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Forms',
  description: 'List the forms owned by the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists forms owned by the connected account, each with its form ID, title and status. Use the returned form ID with other form and submission actions.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of forms to return.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of forms to skip, for pagination.',
      required: false,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user/forms',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      queryParams: {
        ...(context.propsValue.limit !== undefined
          ? { limit: String(context.propsValue.limit) }
          : {}),
        ...(context.propsValue.offset !== undefined
          ? { offset: String(context.propsValue.offset) }
          : {}),
      },
    });
  },
});
