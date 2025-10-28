import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findStaff = createAction({
  auth: myCaseAuth,
  name: 'findStaff',
  displayName: 'Find Staff',
  description: 'Finds a staff',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by staff status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    updated_after: Property.ShortText({
      displayName: 'Updated After',
      description:
        'Filter staff updated after this date (ISO-8601: 2022-03-17T21:00:00Z)',
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

    if (context.propsValue.status) {
      queryParams['filter[status]'] = context.propsValue.status;
    }

    if (context.propsValue.updated_after) {
      queryParams['filter[updated_after]'] = context.propsValue.updated_after;
    }

    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }
    
    return await myCaseApiService.fetchStaffs({
      accessToken: context.auth.access_token,
      queryParams
    })
  },
});
