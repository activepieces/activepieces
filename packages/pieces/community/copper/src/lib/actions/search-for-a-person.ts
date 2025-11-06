import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, toUnix } from '../common/constants';
import {
  multiCompanyDropdown,
  MultiContactTypesDropdown,
  multiOpportunityDropdown,
  multiUsersDropdown,
} from '../common/props';
import { CopperApiService } from '../common/requests';

export const searchForAPerson = createAction({
  auth: CopperAuth,
  name: 'searchForAPerson',
  displayName: 'Search for a Person',
  description: 'Lookup a person using match criteria.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the People to search for.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone Number of the People to search for.',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      required: false,
      description: 'Emails of the People to search for.',
      defaultValue: [],
    }),
    contact_type_ids: MultiContactTypesDropdown({}),
    assignee_ids: multiUsersDropdown({ refreshers: ['auth'] }),
    company_ids: multiCompanyDropdown({ refreshers: ['auth'] }),
    opportunity_ids: multiOpportunityDropdown({ refreshers: ['auth'] }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city in which People must be located.',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'The state or province in which People must be located.',
      required: false,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'The postal code in which People must be located.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'The two character country code where People must be located.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Filter People to those that match at least one of the tags specified.',
      required: false,
      defaultValue: [],
    }),
    socials: Property.Array({
      displayName: 'Socials',
      description:
        'Filter People to those that match at least one of the social accounts specified.',
      required: false,
      defaultValue: [],
    }),
    followed: Property.StaticDropdown({
      displayName: 'Followed',
      description: 'Filter by followed state',
      required: false,
      options: {
        options: [
          {
            label: 'followed',
            value: '1',
          },
          {
            label: 'not followed',
            value: '2',
          },
        ],
      },
    }),
    age: Property.Number({
      displayName: 'Age',
      description: 'The maximum age in seconds that People must be.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Default 50. Max 200.',
      required: false,
      defaultValue: 50,
    }),
    page_number: Property.Number({
      displayName: 'Page Number',
      required: false,
      defaultValue: 1,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'The field on which to sort the results',
      required: false,
      options: {
        options: [
          {
            label: 'Name',
            value: 'name',
          },
          {
            label: 'Title',
            value: 'title',
          },
          {
            label: 'Email',
            value: 'email',
          },
          {
            label: 'Phone',
            value: 'phone',
          },
          {
            label: 'Date Modified',
            value: 'date_modified',
          },
          {
            label: 'Date Created',
            value: 'date_created',
          },
          {
            label: 'City',
            value: 'city',
          },
          {
            label: 'State',
            value: 'state',
          },
          {
            label: 'Country',
            value: 'country',
          },
          {
            label: 'Zip',
            value: 'zip',
          },
          {
            label: 'Socials',
            value: 'socials',
          },
        ],
      },
    }),
    sort_direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'The direction in which to sort the result',
      required: false,
      options: {
        options: [
          {
            label: 'Ascending',
            value: 'asc',
          },
          {
            label: 'Descending',
            value: 'desc',
          },
        ],
      },
    }),
    minimum_interaction_count: Property.Number({
      displayName: 'Minimum Interaction Count',
      required: false,
      description: 'The minimum number of interactions People must have had.',
    }),
    maximum_interaction_count: Property.Number({
      displayName: 'Maximum Interaction Count',
      required: false,
      description: 'The maximum number of interactions People must have had.',
    }),
    minimum_interaction_date: Property.DateTime({
      displayName: 'Minimum Interaction Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date of the last interaction.',
    }),
    maximum_interaction_date: Property.DateTime({
      displayName: 'Maximum Interaction Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date of the last interaction.',
    }),
    minimum_created_date: Property.DateTime({
      displayName: 'Minimum Created Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date People are created.',
    }),
    maximum_created_date: Property.DateTime({
      displayName: 'Maximum Created Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date People are Created.',
    }),
  },
  async run(context) {
    const {
      name,
      phone_number,
      emails,
      contact_type_ids,
      assignee_ids,
      company_ids,
      opportunity_ids,
      city,
      state,
      postal_code,
      country,
      tags,
      socials,
      followed,
      age,
      page_size,
      page_number,
      sort_by,
      sort_direction,
      minimum_interaction_count,
      maximum_interaction_count,
      minimum_interaction_date,
      maximum_interaction_date,
      minimum_created_date,
      maximum_created_date,
    } = context.propsValue;

    const payload = {
      name,
      phone_number,
      emails,
      contact_type_ids,
      assignee_ids,
      company_ids,
      opportunity_ids,
      city,
      state,
      postal_code,
      country,
      tags,
      socials,
      followed,
      age,
      page_size,
      page_number,
      sort_by,
      sort_direction,
      minimum_interaction_count,
      maximum_interaction_count,
      minimum_interaction_date: toUnix(minimum_interaction_date),
      maximum_interaction_date: toUnix(maximum_interaction_date),
      minimum_created_date: toUnix(minimum_created_date),
      maximum_created_date: toUnix(maximum_created_date),
    };

    return await CopperApiService.fetchPeople(context.auth, payload);
  },
});
