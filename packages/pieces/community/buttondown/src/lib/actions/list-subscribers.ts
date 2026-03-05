import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../auth';
import { buttondownApiRequest } from '../common';

export const listSubscribers = createAction({
  auth: buttondownAuth,
  name: 'list_subscribers',
  displayName: 'List Subscribers',
  description: 'List subscribers from your Buttondown newsletter',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Subscriber Type',
      description: 'Filter by subscriber status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: '' },
          { label: 'Regular', value: 'regular' },
          { label: 'Unactivated', value: 'unactivated' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Removed', value: 'removed' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1)',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.type) {
      queryParams.type = context.propsValue.type;
    }
    if (context.propsValue.page) {
      queryParams.page = String(context.propsValue.page);
    }

    return await buttondownApiRequest({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/subscribers',
      queryParams,
    });
  },
});
