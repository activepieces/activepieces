import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformListFormReportsOutputSchema } from '../../output-schemas';

export const listFormReports = createAction({
  auth: jotformAuth,
  name: 'jotform_list_form_reports',
  outputSchema: jotformListFormReportsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Form Reports',
  description: 'List reports (grid/export views) for a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the reports (analytics/exports) created for a single form, each with its report ID, title and type. Idempotent — a repeated call returns the same list.',
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
      path: `/form/${context.propsValue.formId}/reports`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
