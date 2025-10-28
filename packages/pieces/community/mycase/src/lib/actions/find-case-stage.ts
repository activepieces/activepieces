import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findCaseStage = createAction({
  auth: myCaseAuth,
  name: 'findCaseStage',
  displayName: 'Find Case Stage',
  description: 'Finds a case stage',
  props: {
    updated_after: Property.ShortText({
      displayName: 'Updated After',
      description:
        'Filter Case Stages updated after this date (ISO-8601: 2022-03-17T21:00:00Z)',
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

    const response = await myCaseApiService.fetchCaseStages({
      accessToken: context.auth.access_token,
      queryParams,
    });

    return response;
  },
});
