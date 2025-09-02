import { createAction } from '@activepieces/pieces-framework';
import { performance_props } from '../common/props';
import { makeRequest } from '../common/requests';
import { validate_props } from '../common/validations';

export const get_website_performance = createAction({
  name: 'get_website_performance',
  displayName: 'Get Website Performance',
  description: 'Fetch website performance data using Browserless performance API.',
  props: performance_props,
  async run(context) {
    // Add validation
    await validate_props.get_website_performance(context.propsValue);

    const url = context.propsValue.page_url;
    const token = context.auth as string;

    const response = await makeRequest('/performance', token, { url });
    const result = await response.json();
    return result;
  }
});
