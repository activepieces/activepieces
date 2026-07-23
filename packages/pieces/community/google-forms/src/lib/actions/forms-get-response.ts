import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  googleFormsAuth,
  getAccessToken,
  GoogleFormsAuthValue,
} from '../common/common';

export const formsGetResponse = createAction({
  auth: googleFormsAuth,
  name: 'forms_get_response',
  displayName: 'Get Form Response',
  description:
    'Fetch one submission by its responseId, including all answers keyed by questionId and submission timestamps.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one full submission by its responseId (resolve via forms_list_responses or the New Response trigger), including all answers keyed by questionId and submission timestamps. Use when you need one submission in detail; to enumerate submissions use forms_list_responses. Answers are keyed by questionId — use forms_get_form to interpret them. Read-only.',
    idempotent: true,
  },
  props: {
    form_id: Property.ShortText({
      displayName: 'Form ID',
      description:
        'The ID of the form the response belongs to. Obtain it from forms_list_responses or the New Response trigger.',
      required: true,
    }),
    response_id: Property.ShortText({
      displayName: 'Response ID',
      description:
        'The ID of the response to fetch. Obtain it from forms_list_responses or the New Response trigger.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = await getAccessToken(auth as GoogleFormsAuthValue);

    try {
      const response = await httpClient.sendRequest<Record<string, unknown>>({
        method: HttpMethod.GET,
        url: `https://forms.googleapis.com/v1/forms/${propsValue.form_id}/responses/${propsValue.response_id}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        throw new Error(
          `Response not found. Check the form ID (${propsValue.form_id}) and response ID (${propsValue.response_id}).`
        );
      }
      if (status === 403) {
        throw new Error(
          'Permission denied reading the response. The connection may not have access to this form.'
        );
      }
      if (status === 429) {
        throw new Error('Rate limited by the Google Forms API. Retry after a short delay.');
      }
      throw error;
    }
  },
});
