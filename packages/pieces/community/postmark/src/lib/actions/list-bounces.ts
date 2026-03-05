import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';
import { postmarkApiRequest } from '../common';

export const listBounces = createAction({
  auth: postmarkAuth,
  name: 'list_bounces',
  displayName: 'List Bounces',
  description: 'List email bounces with optional filters',
  props: {
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of bounces to return (max: 500)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of bounces to skip',
      required: false,
      defaultValue: 0,
    }),
    type: Property.StaticDropdown({
      displayName: 'Bounce Type',
      description: 'Filter by bounce type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: '' },
          { label: 'Hard Bounce', value: 'HardBounce' },
          { label: 'Soft Bounce', value: 'SoftBounce' },
          { label: 'Transient', value: 'Transient' },
          { label: 'Spam Complaint', value: 'SpamComplaint' },
        ],
      },
    }),
    emailFilter: Property.ShortText({
      displayName: 'Email Filter',
      description: 'Filter by email address',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Filter by tag',
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {
      count: String(context.propsValue.count ?? 100),
      offset: String(context.propsValue.offset ?? 0),
    };

    if (context.propsValue.type) {
      queryParams['type'] = context.propsValue.type;
    }
    if (context.propsValue.emailFilter) {
      queryParams['emailFilter'] = context.propsValue.emailFilter;
    }
    if (context.propsValue.tag) {
      queryParams['tag'] = context.propsValue.tag;
    }

    return await postmarkApiRequest({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/bounces',
      queryParams,
    });
  },
});
