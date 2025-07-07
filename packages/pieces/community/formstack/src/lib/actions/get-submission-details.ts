import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { formIdDropdown, submissionIdDropdown } from '../common/props';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getSubmissionDetails = createAction({
  auth: formStackAuth,
  name: 'getSubmissionDetails',
  displayName: 'Get Submission Details',
  description: 'Fetch details of a specific submission by its ID.',
  props: {
    form_id: formIdDropdown,
    submission_id: submissionIdDropdown,
    encryption_password: Property.ShortText({
      displayName: 'Encryption Password',
      description: 'The encryption password for the form. DEPRECATED use X-FS-ENCRYPTION-PASSWORD header instead',
      required: false,
    }),
  },
  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    const {
      form_id,
      submission_id,
      encryption_password,
    } = context.propsValue

    const queryParams = {
      encryption_password,
    }
    const response = await makeRequest(
      accessToken,
      HttpMethod.GET,
      `submission/${submission_id}.json`,
      {},
      queryParams
    );

    return response

  },
});
