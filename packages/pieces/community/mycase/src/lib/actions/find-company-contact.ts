import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findCompanyContact = createAction({
  auth: myCaseAuth,
  name: 'findCompanyContact',
  displayName: 'Find Company Contact',
  description: 'Finds a company',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Filter by company name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter by email address',
      required: false,
    }),
    main_phone_number: Property.ShortText({
      displayName: 'Main Phone Number',
      description: 'Filter by main phone number',
      required: false,
    }),
    fax_phone_number: Property.ShortText({
      displayName: 'Fax Phone Number',
      description: 'Filter by fax phone number',
      required: false,
    }),
    updated_after: Property.ShortText({
      displayName: 'Updated After',
      description:
        'Filter companies updated after this date (ISO-8601: 2022-03-17T21:00:00Z)',
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

    if (context.propsValue.name) {
      queryParams['filter[name]'] = context.propsValue.name;
    }

    if (context.propsValue.email) {
      queryParams['filter[email]'] = context.propsValue.email;
    }

    if (context.propsValue.main_phone_number) {
      queryParams['filter[main_phone_number]'] =
        context.propsValue.main_phone_number;
    }

    if (context.propsValue.fax_phone_number) {
      queryParams['filter[fax_phone_number]'] =
        context.propsValue.fax_phone_number;
    }

    if (context.propsValue.updated_after) {
      queryParams['filter[updated_after]'] = context.propsValue.updated_after;
    }

    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    return await myCaseApiService.fetchCompanies({
      accessToken: context.auth.access_token,
      queryParams
    })
  },
});
