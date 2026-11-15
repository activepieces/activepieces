import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformDeleteFormQuestionOutputSchema } from '../../output-schemas';

export const deleteReport = createAction({
  auth: jotformAuth,
  name: 'jotform_delete_report',
  outputSchema: jotformDeleteFormQuestionOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Report',
  description: 'Delete a report.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a report. Pairs with Create Form Report. Not idempotent — deleting an already-removed report fails.',
    idempotent: false,
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
      method: HttpMethod.DELETE,
      path: `/report/${context.propsValue.reportId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
