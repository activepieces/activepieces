import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  googleFormsAuth,
  getAccessToken,
  GoogleFormsAuthValue,
} from '../common/common';

export const formsGetForm = createAction({
  auth: googleFormsAuth,
  name: 'forms_get_form',
  displayName: 'Get Form',
  description:
    'Fetch a form\'s full structure: title, settings, items with their indices and itemIds, question IDs, and current revisionId.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a form\'s full structure: its title/description, settings, the ordered list of items with their itemId and index, the questionId of each question, and the current revisionId. Use this before any edit (to get item indices and the revision) and before reading responses (to map answer questionIds to prompts). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    form_id: Property.ShortText({
      displayName: 'Form ID',
      description:
        'The ID of the form to fetch. Obtain it from forms_create_form, forms_list_responses, or the New Response trigger.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = await getAccessToken(auth as GoogleFormsAuthValue);

    try {
      const response = await httpClient.sendRequest<Record<string, unknown>>({
        method: HttpMethod.GET,
        url: `https://forms.googleapis.com/v1/forms/${propsValue.form_id}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        throw new Error(
          `Form not found: ${propsValue.form_id}. Check the form ID.`
        );
      }
      if (status === 403) {
        throw new Error(
          'Permission denied reading the form. The connection may not have access to this form.'
        );
      }
      if (status === 429) {
        throw new Error('Rate limited by the Google Forms API. Retry after a short delay.');
      }
      throw error;
    }
  },
});
