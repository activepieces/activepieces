import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import {
  captainDataClient,
  captainDataUtils,
  SALES_NAVIGATOR_QUERY_HINT,
} from '../common';

export const searchPeople = createAction({
  name: 'search_people',
  classification: 'SEARCH',
  displayName: 'Search People',
  description:
    'Searches LinkedIn Sales Navigator people with a query and returns one page of up to 25 results. Costs 1 credit plus 1 credit per result.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a Sales Navigator people search and returns one page (up to 25) of people with uid, name, job title, company and LinkedIn URLs. Costs 1 credit plus 1 per result, so keep queries narrow. query is the Sales Navigator query string (the part after "?query=" in a Sales Navigator people search URL). It must use Sales Navigator filter syntax, e.g. (keywords:CEO); plain text such as CEO is rejected, and account-specific filters are not supported. When has_more is true, call again with cursor set to next_cursor; cursors expire after 24 hours, and an expired cursor means starting again from the first page.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description:
        'Sales Navigator query: the value after "?query=" in a Sales Navigator people search URL. Use Sales Navigator filter syntax, e.g. (keywords:CEO); plain text is rejected. Filters tied to your own Sales Navigator account, such as saved lists, are not supported.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'Next Cursor from a previous run, to get the next page. Cursors expire after 24 hours; an expired cursor means starting again from the first page.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'items',
        label: 'People',
        labelKey: 'full_name',
        listItems: [
          { key: 'uid', label: 'Person UID' },
          { key: 'full_name', label: 'Full Name' },
          { key: 'first_name', label: 'First Name' },
          { key: 'last_name', label: 'Last Name' },
          { key: 'headline', label: 'Headline' },
          { key: 'job_title', label: 'Job Title' },
          { key: 'company_name', label: 'Company Name' },
          { key: 'summary', label: 'Summary' },
          { key: 'location', label: 'Location' },
          {
            key: 'li_profile_id',
            label: 'LinkedIn Profile ID',
            format: 'number',
          },
          {
            key: 'li_profile_url',
            label: 'LinkedIn Profile URL',
            format: 'url',
          },
          {
            key: 'li_profile_image_url',
            label: 'Profile Image',
            format: 'image',
          },
          { key: 'li_company_id', label: 'LinkedIn Company ID' },
          { key: 'job_start', label: 'Job Start' },
          { key: 'job_time_period', label: 'Job Time Period' },
          { key: 'recently_hired', label: 'Recently Hired', format: 'boolean' },
          {
            key: 'recently_promoted',
            label: 'Recently Promoted',
            format: 'boolean',
          },
          { key: 'extracted_at', label: 'Extracted At', format: 'datetime' },
        ],
      },
      { key: 'next_cursor', label: 'Next Cursor' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  async run({ auth, propsValue }) {
    return captainDataClient.getList({
      apiKey: auth.props.apiKey,
      path: '/people/search',
      operation: 'search people',
      invalidInputHint: SALES_NAVIGATOR_QUERY_HINT,
      queryParams: {
        query: captainDataUtils.requireText({
          value: propsValue.query,
          field: 'Query',
        }),
        cursor: captainDataUtils.optionalText({ value: propsValue.cursor }),
      },
    });
  },
});
