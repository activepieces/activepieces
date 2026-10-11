import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformCreateFormSubmissionOutputSchema } from '../../output-schemas';

export const updateSubmission = createAction({
  auth: jotformAuth,
  name: 'jotform_update_submission',
  outputSchema: jotformCreateFormSubmissionOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Submission',
  description: "Edit a submission's answers or status.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a submission from a key/value map, e.g. {"status":"ACTIVE"} or {"3":"Jane Doe"} to change an answer. Only the supplied keys change. Idempotent — setting the same value again is a no-op.',
    idempotent: true,
  },
  props: {
    submissionId: Property.ShortText({
      displayName: 'Submission ID',
      description: 'The ID of the submission, from List Form Submissions.',
      required: true,
    }),
    updates: Property.Json({
      displayName: 'Updates',
      description:
        'Key/value map to update, e.g. {"status":"ACTIVE"} or a question ID to a new answer.',
      required: true,
    }),
  },
  async run(context) {
    const { submissionId, updates } = context.propsValue;
    if (typeof updates !== 'object' || updates === null || Array.isArray(updates)) {
      throw new Error('updates must be a JSON object of key/value pairs.');
    }
    const body: Record<string, unknown> = {};
    Object.entries(updates as Record<string, unknown>).forEach(([key, value]) => {
      jotformCommon.flattenForForm(`submission[${key}]`, value, body);
    });
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: `/submission/${submissionId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body,
      form: true,
    });
  },
});
