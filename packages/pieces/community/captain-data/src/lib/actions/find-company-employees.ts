import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import {
  captainDataClient,
  captainDataUtils,
  SALES_NAVIGATOR_QUERY_HINT,
  COMPANY_ID_NOT_FOUND_HINT,
} from '../common';

export const findCompanyEmployees = createAction({
  name: 'find_company_employees',
  classification: 'SEARCH',
  displayName: 'Find Company Employees',
  description:
    'Lists employees of a company, optionally filtered by a Sales Navigator query, one page of up to 25 at a time. Costs 1 credit plus 1 credit per result.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one page (up to 25) of employees of a company identified by company_id: either its Captain Data uid (from Enrich Company or Search Companies) or its numeric li_company_id (from Find Company), with name, job title, LinkedIn URLs and tenure. Costs 1 credit plus 1 per result, so add a narrow query. query is an optional Sales Navigator query string. It must use Sales Navigator filter syntax, e.g. (keywords:CEO); plain text such as CEO is not rejected but filters nothing and returns all employees, and filters tied to your own Sales Navigator account are not supported. When has_more is true, call again with cursor set to next_cursor; cursors expire after 24 hours, and an expired cursor means starting again from the first page.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description:
        "The company's Captain Data UID (from Enrich Company or Search Companies) or its numeric LinkedIn Company ID (from Find Company), e.g. 94273421.",
      required: true,
    }),
    query: Property.LongText({
      displayName: 'Query',
      description:
        'Optional Sales Navigator query to filter employees (the value after "?query="). Use Sales Navigator filter syntax, e.g. (keywords:CEO). Plain text such as CEO is not rejected but does not filter, so it returns a full page of all employees (26 credits). Filters tied to your own Sales Navigator account, such as saved lists, are not supported.',
      required: false,
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
        label: 'Employees',
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
          { key: 'profile_image_url', label: 'Profile Image', format: 'image' },
          {
            key: 'sn_company_id',
            label: 'Sales Navigator Company ID',
            format: 'number',
          },
          { key: 'tenure_start', label: 'Tenure Start' },
          { key: 'tenure_length', label: 'Tenure Length' },
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
    const companyUid = captainDataUtils.requireText({
      value: propsValue.company_id,
      field: 'Company ID',
    });
    return captainDataClient.getList({
      apiKey: auth.props.apiKey,
      path: `/companies/${encodeURIComponent(companyUid)}/employees`,
      operation: 'find company employees',
      invalidInputHint: SALES_NAVIGATOR_QUERY_HINT,
      notFoundHint: COMPANY_ID_NOT_FOUND_HINT,
      queryParams: {
        query: captainDataUtils.optionalText({ value: propsValue.query }),
        cursor: captainDataUtils.optionalText({ value: propsValue.cursor }),
      },
    });
  },
});
