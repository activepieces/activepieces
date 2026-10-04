import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformListAllReportsOutputSchema } from '../../output-schemas';

export const listAllReports = createAction({
  auth: jotformAuth,
  name: 'jotform_list_all_reports',
  outputSchema: jotformListAllReportsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List All Reports',
  description: 'List reports across every form owned by the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists reports (analytics/exports) across all of the connected account\'s forms, each with its report ID, title, type and the form it belongs to.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of reports to return.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of reports to skip, for pagination.',
      required: false,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user/reports',
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
