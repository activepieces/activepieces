import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformBulkCreateFormSubmissionsOutputSchema } from '../../output-schemas';

export const bulkCreateFormSubmissions = createAction({
  auth: jotformAuth,
  name: 'jotform_bulk_create_form_submissions',
  outputSchema: jotformBulkCreateFormSubmissionsOutputSchema,
  classification: 'WRITE',
  displayName: 'Bulk Create Form Submissions',
  description: 'Bulk create submissions for a form from a JSON array.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Bulk creates submissions for a form from a JSON array of answer maps (each keyed by question ID). Not idempotent — each call creates new submissions.',
    idempotent: false,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    submissions: Property.Json({
      displayName: 'Submissions',
      description:
        'JSON array of answer maps, each keyed by question ID, e.g. [{"3":"John Doe"}].',
      required: true,
    }),
  },
  async run(context) {
    const { formId, submissions } = context.propsValue;
    if (!Array.isArray(submissions) || submissions.length === 0) {
      throw new Error('submissions must be a non-empty array.');
    }
    const body = submissions.map((submission) => {
      if (typeof submission !== 'object' || submission === null || Array.isArray(submission)) {
        throw new Error('each submission must be a JSON object of question ID to answer.');
      }
      const entry: Record<string, unknown> = {};
      Object.entries(submission as Record<string, unknown>).forEach(([questionId, value]) => {
        entry[questionId] = { text: value };
      });
      return entry;
    });
    return jotformCommon.request({
      method: HttpMethod.PUT,
      path: `/form/${formId}/submissions`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body,
    });
  },
});
