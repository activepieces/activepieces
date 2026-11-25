import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import {
  captainDataClient,
  captainDataUtils,
  SALES_NAVIGATOR_QUERY_HINT,
} from '../common';

export const searchCompanies = createAction({
  name: 'search_companies',
  classification: 'SEARCH',
  displayName: 'Search Companies',
  description:
    'Searches LinkedIn Sales Navigator companies with a query and returns one page of up to 25 results. Costs 1 credit plus 1 credit per result.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a Sales Navigator company search and returns one page (up to 25) of companies with uid, name, description, LinkedIn URLs, category and employee count. Costs 1 credit plus 1 per result, so keep queries narrow. query is the Sales Navigator query string (the part after "?query=" in a Sales Navigator company (account) search URL). It must use Sales Navigator filter syntax, e.g. (keywords:CEO); plain text such as CEO is rejected, and account-specific filters are not supported. When has_more is true, call again with cursor set to next_cursor; cursors expire after 24 hours, and an expired cursor means starting again from the first page. Pass uid or li_company_id to Find Company Employees or li_company_url to Enrich Company.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description:
        'Sales Navigator query: the value after "?query=" in a Sales Navigator company (account) search URL. Use Sales Navigator filter syntax, e.g. (keywords:CEO); plain text is rejected. Filters tied to your own Sales Navigator account, such as saved lists, are not supported.',
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
        label: 'Companies',
        labelKey: 'company_name',
        listItems: [
          { key: 'uid', label: 'Company UID' },
          { key: 'company_name', label: 'Company Name' },
          { key: 'description', label: 'Description' },
          {
            key: 'li_company_url',
            label: 'LinkedIn Company URL',
            format: 'url',
          },
          { key: 'li_company_id', label: 'LinkedIn Company ID' },
          {
            key: 'sn_company_url',
            label: 'Sales Navigator URL',
            format: 'url',
          },
          { key: 'category', label: 'Category' },
          { key: 'number_employees', label: 'Number of Employees' },
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
      path: '/companies/search',
      operation: 'search companies',
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
