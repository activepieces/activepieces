import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  formSlugOrIdDropdown,
  partialsubmissionIdDropdown,
} from '../common/props';

export const deletePartialFormSubmission = createAction({
  auth: PaperformAuth,
  name: 'deletePartialFormSubmission',
  displayName: 'Delete Partial Form Submission',
  description: 'Delete a partial form submission by its ID',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    partial_submission_id: partialsubmissionIdDropdown,
  },
  async run(context) {
    const { slug_or_id, partial_submission_id } = context.propsValue;
    const apiKey = context.auth as string;

    await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/forms/${slug_or_id}/partial-submissions/${partial_submission_id}`
    );

    return {
      success: true,
      message: `Successfully deleted partial submission ${partial_submission_id}`,
      partial_submission_id,
    };
  },
});
