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
    search_field: Property.ShortText({
      displayName: 'Search Field ID',
      description: 'Field id to search (e.g., email, name, etc.)',
      required: true,
    }),

  },
  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    const {
      form_id,
      search_field,

    } = context.propsValue;

    const params = new URLSearchParams();
    params.append('per_page', '25')
    if (search_field) params.append('search', search_field);


    const url = `/submission.json?${params.toString()}`;

    return await makeRequest(
      accessToken,
      HttpMethod.GET,
      url,
      {},
      {}
    );
  },
});
