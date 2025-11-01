import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseApiService } from '../common/requests';
import { myCaseAuth } from '../common/auth';

export const findCaller = createAction({
  auth: myCaseAuth,
  name: 'findCaller',
  displayName: 'Find Caller',
  description: 'Finds a caller',
  props: {
    updated_after: Property.ShortText({
      displayName: 'Updated After',
      description:
        'Filter calls updated after this date (ISO-8601: 2022-03-17T21:00:00Z)',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (1-1000)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.updated_after) {
      queryParams['filter[updated_after]'] = context.propsValue.updated_after;
    }

    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    const response = await myCaseApiService.fetchCalls({
      accessToken: context.auth.access_token,
      queryParams
    });

    return response
  },
});
