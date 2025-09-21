import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const findCompanyAction = createAction({
  auth: teamworkAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Search for a company by name.',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'The name or part of the name of the company to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { searchTerm } = propsValue;

    if (!searchTerm) {
      throw new Error('Search term is required.');
    }
    
    const allCompanies = await teamworkClient.getCompanies(auth as TeamworkAuth);

    const foundCompanies = allCompanies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (foundCompanies.length === 0) {
      return {
        message: `No companies found matching the search term: "${searchTerm}"`,
        companies: [],
      };
    }

    return {
      message: `Found ${foundCompanies.length} companies matching the search term.`,
      companies: foundCompanies,
    };
  },
});