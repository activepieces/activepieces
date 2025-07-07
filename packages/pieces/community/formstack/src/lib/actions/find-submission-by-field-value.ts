import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { formIdDropdown } from '../common/props';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findSubmissionByFieldValue = createAction({
  auth: formStackAuth,
  name: 'findSubmissionByFieldValue',
  displayName: 'Find Submission by Field Value',
  description: 'Search for a submission based on field values (e.g., email, name).',
  props: {
    form_id: formIdDropdown,
    search_field_x: Property.ShortText({
      displayName: 'Search Field ID',
      description: 'Field id to search (e.g., email, name, etc.)',
      required: true,
    }),
    search_value_x: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for in the field',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number of results',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Number of results per page (max 100)',
      required: false,
    }),
  },
  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    const {
      form_id,
      search_field_x,
      search_value_x,
      page,
      per_page,
    } = context.propsValue;

    const params = new URLSearchParams();
    if (search_field_x) params.append('search_field_x', search_field_x);
    if (search_value_x) params.append('search_value_x', search_value_x);
    if (page) params.append('page', page.toString());
    if (per_page) params.append('per_page', per_page.toString());

    const url = `/form/${form_id}/submission.json?${params.toString()}`;

    return await makeRequest(
      accessToken,
      HttpMethod.GET,
      url,
      {},
      {}
    );
  },
});
