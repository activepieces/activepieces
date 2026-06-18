import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const searchPeople = createAction({
  auth: linkupAuth,
  name: 'search_people',
  displayName: 'Search People',
  description: 'Search LinkedIn profiles by keyword, company, title, location, school, industry and more. Returns the LinkedIn URL of each match.',
  props: {
    accountId: accountIdProp,
    keyword: Property.ShortText({ displayName: 'Keyword', required: false }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    title: Property.ShortText({ displayName: 'Current Job Title', required: false }),
    companyName: Property.ShortText({ displayName: 'Current Company Name', required: false }),
    companyUrl: Property.ShortText({
      displayName: 'Company URL',
      description: 'LinkedIn company page URL',
      required: false,
    }),
    pastCompany: Property.ShortText({ displayName: 'Past Company', required: false }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'e.g. "San Francisco"',
      required: false,
    }),
    schoolUrl: Property.ShortText({ displayName: 'School URL', required: false }),
    industry: Property.ShortText({ displayName: 'Industry', required: false }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'Connection degree relative to the account',
      required: false,
      options: {
        options: [
          { label: '1st degree (F)', value: 'F' },
          { label: '2nd degree (S)', value: 'S' },
          { label: '3rd+ degree (O)', value: 'O' },
        ],
      },
    }),
    connectionOf: Property.ShortText({
      displayName: 'Connection Of',
      description: 'Show connections of a specific profile (URL or identifier)',
      required: false,
    }),
    followerOf: Property.ShortText({
      displayName: 'Follower Of',
      description: 'Show followers of a specific company or profile',
      required: false,
    }),
    fetchInvitationState: Property.Checkbox({
      displayName: 'Fetch Invitation State',
      description: 'Include the connection invitation state for each result',
      required: false,
      defaultValue: true,
    }),
    totalResults: Property.Number({
      displayName: 'Total Results',
      description: 'Number of results to return (1 credit per 10 results)',
      required: false,
      defaultValue: 10,
    }),
    startPage: Property.Number({ displayName: 'Start Page', required: false }),
    endPage: Property.Number({ displayName: 'End Page', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return linkupAction(context.auth.secret_text, 'profiles', 'search_people', p.accountId, {
      keyword: p.keyword,
      first_name: p.firstName,
      last_name: p.lastName,
      title: p.title,
      company_name: p.companyName,
      company_url: p.companyUrl,
      past_company: p.pastCompany,
      location: p.location,
      school_url: p.schoolUrl,
      industry: p.industry,
      network: p.network,
      connection_of: p.connectionOf,
      follower_of: p.followerOf,
      fetch_invitation_state: p.fetchInvitationState,
      total_results: p.totalResults,
      start_page: p.startPage,
      end_page: p.endPage,
    });
  },
});
