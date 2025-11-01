import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findPersonContact = createAction({
  auth: myCaseAuth,
  name: 'findPersonContact',
  displayName: 'Find Person Contact',
  description: 'Finds a person',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Filter by first name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Filter by last name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter by email address',
      required: false,
    }),
    cell_phone_number: Property.ShortText({
      displayName: 'Cell Phone Number',
      description: 'Filter by cell phone number',
      required: false,
    }),
    work_phone_number: Property.ShortText({
      displayName: 'Work Phone Number',
      description: 'Filter by work phone number',
      required: false,
    }),
    home_phone_number: Property.ShortText({
      displayName: 'Home Phone Number',
      description: 'Filter by home phone number',
      required: false,
    }),
    updated_after: Property.ShortText({
      displayName: 'Updated After',
      description:
        'Filter clients updated after this date (ISO-8601: 2022-03-17T21:00:00Z)',
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

    if (context.propsValue.first_name) {
      queryParams['filter[first_name]'] = context.propsValue.first_name;
    }

    if (context.propsValue.last_name) {
      queryParams['filter[last_name]'] = context.propsValue.last_name;
    }

    if (context.propsValue.email) {
      queryParams['filter[email]'] = context.propsValue.email;
    }

    if (context.propsValue.cell_phone_number) {
      queryParams['filter[cell_phone_number]'] =
        context.propsValue.cell_phone_number;
    }

    if (context.propsValue.work_phone_number) {
      queryParams['filter[work_phone_number]'] =
        context.propsValue.work_phone_number;
    }

    if (context.propsValue.home_phone_number) {
      queryParams['filter[home_phone_number]'] =
        context.propsValue.home_phone_number;
    }

    if (context.propsValue.updated_after) {
      queryParams['filter[updated_after]'] = context.propsValue.updated_after;
    }

    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    return await myCaseApiService.fetchClients({
      accessToken: context.auth.access_token,
      queryParams
    })
  },
});
