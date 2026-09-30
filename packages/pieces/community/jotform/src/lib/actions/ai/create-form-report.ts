import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformCreateFormReportOutputSchema } from '../../output-schemas';

export const createFormReport = createAction({
  auth: jotformAuth,
  name: 'jotform_create_form_report',
  outputSchema: jotformCreateFormReportOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Form Report',
  description: 'Create a new report (grid/table/rss) for a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new report for a form, e.g. a grid, table or RSS export of its submissions. Returns the new report ID. Not idempotent — each call creates a new report.',
    idempotent: false,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new report.',
      required: true,
    }),
    listType: Property.ShortText({
      displayName: 'List Type',
      description: 'The report type, e.g. "grid", "table" or "rss".',
      required: true,
    }),
  },
  async run(context) {
    const { formId, title, listType } = context.propsValue;
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: `/form/${formId}/reports`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: { title, list_type: listType },
      form: true,
    });
  },
});
