import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetReportOutputSchema } from '../../output-schemas';

export const getReport = createAction({
  auth: jotformAuth,
  name: 'jotform_get_report',
  outputSchema: jotformGetReportOutputSchema,
  classification: 'READ',
  displayName: 'Get Report',
  description: 'Get a report by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns a single report\'s metadata: title, list type, owning form and URL.',
    idempotent: true,
  },
  props: {
    reportId: Property.ShortText({
      displayName: 'Report ID',
      description: 'The ID of the report, from List Form Reports or List All Reports.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/report/${context.propsValue.reportId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
