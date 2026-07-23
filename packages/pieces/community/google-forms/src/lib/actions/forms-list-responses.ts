import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  googleFormsAuth,
  getAccessToken,
  GoogleFormsAuthValue,
} from '../common/common';

export const formsListResponses = createAction({
  auth: googleFormsAuth,
  name: 'forms_list_responses',
  displayName: 'List Form Responses',
  description:
    'List submitted responses for a form, with each response\'s responseId, timestamps, and answers keyed by questionId.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists submitted responses for a form, with each response\'s responseId, timestamps, and answers keyed by questionId. Answers are keyed by opaque questionId — call forms_get_form to map them to prompts. Supports a "timestamp > / <" filter and pagination via page_token; an empty list is valid (no submissions yet). Read-only.',
    idempotent: true,
  },
  props: {
    form_id: Property.ShortText({
      displayName: 'Form ID',
      description:
        'The ID of the form whose responses to list. Obtain it from forms_create_form, forms_get_form, or the New Response trigger.',
      required: true,
    }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description:
        'Optional filter on submission time, e.g. "timestamp > 2026-01-01T00:00:00Z" or "timestamp < 2026-06-01T00:00:00Z". Only the timestamp field is supported.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of responses to return per page (default 5000).',
      required: false,
    }),
    page_token: Property.ShortText({
      displayName: 'Page Token',
      description:
        'Token from a previous call\'s nextPageToken to fetch the next page of responses.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = await getAccessToken(auth as GoogleFormsAuthValue);

    const queryParams: Record<string, string> = {};
    if (propsValue.filter) {
      queryParams['filter'] = propsValue.filter;
    }
    if (propsValue.page_size !== undefined && propsValue.page_size !== null) {
      queryParams['pageSize'] = String(propsValue.page_size);
    }
    if (propsValue.page_token) {
      queryParams['pageToken'] = propsValue.page_token;
    }

    try {
      const response = await httpClient.sendRequest<{
        responses?: Record<string, unknown>[];
        nextPageToken?: string;
      }>({
        method: HttpMethod.GET,
        url: `https://forms.googleapis.com/v1/forms/${propsValue.form_id}/responses`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        queryParams,
      });

      const responses = response.body.responses ?? [];
      return {
        responses,
        count: responses.length,
        nextPageToken: response.body.nextPageToken,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        throw new Error(
          `Form not found: ${propsValue.form_id}. Check the form ID.`
        );
      }
      if (status === 403) {
        throw new Error(
          'Permission denied reading responses. The connection may not have access to this form.'
        );
      }
      if (status === 429) {
        throw new Error('Rate limited by the Google Forms API. Retry after a short delay.');
      }
      throw error;
    }
  },
});
