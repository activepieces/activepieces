import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformListFormSubmissionsOutputSchema } from '../../output-schemas';

export const listFormSubmissions = createAction({
  auth: jotformAuth,
  name: 'jotform_list_form_submissions',
  outputSchema: jotformListFormSubmissionsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Form Submissions',
  description: 'List submissions for a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists a form's submissions: submission ID, status, created date and answers keyed by question ID. Idempotent — a repeated call returns the same list.",
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of submissions to return.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of submissions to skip, for pagination.',
      required: false,
    }),
  },
  async run(context) {
    const { formId, limit, offset } = context.propsValue;
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/form/${formId}/submissions`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      queryParams: {
        ...(limit !== undefined ? { limit: String(limit) } : {}),
        ...(offset !== undefined ? { offset: String(offset) } : {}),
      },
    });
  },
});
