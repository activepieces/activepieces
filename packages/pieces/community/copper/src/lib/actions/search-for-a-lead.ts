import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, toUnix } from '../common/constants';
import {
  MultiCustomerSourceDropdown,
  MultiLeadStatusDropdown,
  multiUsersDropdown,
} from '../common/props';
import { CopperApiService } from '../common/requests';

export const searchForALead = createAction({
  auth: CopperAuth,
  name: 'searchForALead',
  displayName: 'Search for a Lead',
  description: 'Lookup a lead using match criteria.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the Lead to search for.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone Number of the Lead to search for.',
      required: false,
    }),
    emails: Property.ShortText({
      displayName: 'Emails',
      required: false,
      description: 'Emails of the Lead to search for.	',
    }),
    assignee_ids: multiUsersDropdown({ refreshers: ['auth'] }),
    status_ids: MultiLeadStatusDropdown({}),
    customer_source_ids: MultiCustomerSourceDropdown({}),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city in which Lead must be located.',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'The state or province in which Lead must be located.',
      required: false,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'The postal code in which Lead must be located.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'The two character country code where Lead must be located.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Filter Lead to those that match at least one of the tags specified.',
      required: false,
      defaultValue: [],
    }),
    socials: Property.Array({
      displayName: 'Socials',
      description:
        'Filter Lead to those that match at least one of the social accounts specified.',
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
      description: 'The maximum age in seconds that Lead must be.',
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
            label: 'Company Name',
            value: 'company_name',
          },
          {
            label: 'Title',
            value: 'title',
          },
          {
            label: 'Value',
            value: 'value',
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
            label: 'Inactive Days',
            value: 'inactive_days',
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
    include_converted_leads: Property.Checkbox({
      displayName: 'Include Converted Leads',
      description: 'Specify if response should contain converted leads.',
      required: false,
      defaultValue: false,
    }),
    minimum_monetary_value: Property.Number({
      displayName: 'Minimum Monetary Value',
      required: false,
      description: 'The minimum monetary value Leads must have.',
    }),
    maximum_monetary_value: Property.Number({
      displayName: 'Maximum Monetary Value',
      required: false,
      description: 'The maximum monetary value Leads must have.',
    }),
    minimum_interaction_count: Property.Number({
      displayName: 'Minimum Interaction Count',
      required: false,
      description: 'The minimum number of interactions Lead must have had.',
    }),
    maximum_interaction_count: Property.Number({
      displayName: 'Maximum Interaction Count',
      required: false,
      description: 'The maximum number of interactions Lead must have had.',
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
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date Lead are created.',
    }),
    maximum_created_date: Property.DateTime({
      displayName: 'Maximum Created Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date Lead are Created.',
    }),
    minimum_modified_date: Property.DateTime({
      displayName: 'Minimum Modified Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the earliest date Lead are Modified.',
    }),
    maximum_modified_date: Property.DateTime({
      displayName: 'Maximum Modified Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest date Lead are Modified.',
    }),
  },
  async run(context) {
    const {
      name,
      phone_number,
      emails,
      assignee_ids,
      status_ids,
      customer_source_ids,
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
      minimum_monetary_value,
      maximum_monetary_value,
      minimum_modified_date,
      maximum_modified_date,
    } = context.propsValue;

    const payload = {
      name,
      phone_number,
      emails,
      assignee_ids,
      status_ids,
      customer_source_ids,
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
      minimum_monetary_value,
      maximum_monetary_value,
      minimum_modified_date: toUnix(minimum_modified_date),
      maximum_modified_date: toUnix(maximum_modified_date),
    };

    return await CopperApiService.fetchLeads(context.auth, payload);
  },
});
