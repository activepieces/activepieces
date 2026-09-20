import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const searchLinkedinCompaniesAction = createAction({
  auth: neuralvergeAuth,
  name: 'search_linkedin_companies',
  classification: 'SEARCH',
  displayName: 'Search LinkedIn Companies',
  description: 'Search LinkedIn companies by keyword, size, industry and location. Cost: 5 points per company (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Search LinkedIn companies by keyword with optional size, industry and location filters. Billed per company returned, so keep Max Items small. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    search_query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords to search for, for example AI companies.',
      required: true,
    }),
    company_size: Property.Array({
      displayName: 'Company Sizes',
      description: 'Company size buckets, for example 51-200.',
      required: false,
    }),
    industry_ids: Property.Array({
      displayName: 'Industries',
      description: 'Industry names or LinkedIn industry IDs, for example Software.',
      required: false,
    }),
    locations: Property.Array({
      displayName: 'Locations',
      description: 'Locations to filter by, for example Amsterdam.',
      required: false,
    }),
    max_items: Property.Number({
      displayName: 'Max Items',
      description: 'Maximum number of companies to return. Each company is billed.',
      required: false,
      defaultValue: 5,
    }),
    start_page: Property.Number({
      displayName: 'Start Page',
      description: 'Result page to start from.',
      required: false,
      defaultValue: 1,
    }),
    scraper_mode: Property.StaticDropdown({
      displayName: 'Detail Level',
      description: 'How much detail to return per company.',
      required: false,
      defaultValue: "short",
      options: {
        disabled: false,
        options: [
          { label: 'Short (faster, fewer fields)', value: 'short' },
          { label: 'Full (all profile fields)', value: 'full' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-linkedin-company-search',
      body: {
        searchQuery: propsValue.search_query,
        companySize: neuralvergeClient.toStringList(propsValue.company_size),
        industryIds: neuralvergeClient.toStringList(propsValue.industry_ids),
        locations: neuralvergeClient.toStringList(propsValue.locations),
        maxItems: propsValue.max_items,
        startPage: propsValue.start_page,
        scraperMode: propsValue.scraper_mode,
      },
    });
  },
});
