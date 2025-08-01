import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { formSlugOrIdDropdown, submissionIdDropdown } from '../common/props';

export const deleteFormSubmission = createAction({
  auth: PaperformAuth,
  name: 'deleteFormSubmission',
  displayName: 'Delete Form Submission',
  description: 'Delete a specific form submission by its ID',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    submission_id: submissionIdDropdown,
  },
  async run(context) {
    const { slug_or_id, submission_id } = context.propsValue;
    const apiKey = context.auth as string;

    const response = await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/forms/${slug_or_id}/submissions/${submission_id}`
    );

    return {
      success: true,
      message: `Successfully deleted submission ${submission_id} from form ${slug_or_id}`,
      submissionId: submission_id,
      formSlugOrId: slug_or_id,
    };
  },
});
