import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  freshnessProp,
  maxCreditsProp,
  veezeeApiCall,
  veezeeAuth,
} from '../common';

export const searchPeopleAction = createAction({
  name: 'search_people',
  displayName: 'Search LinkedIn People',
  description:
    'Search people on LinkedIn by keywords and filters. Costs 10 credits including the first 10 results; each further 10 results add 1 credit (max 30 per call; keyless and trial callers are capped at 10). Works with or without an API key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find people on LinkedIn by keywords, name, title, school, or company when you do not have a profile URL; for a known person use Get LinkedIn Profile instead. Provide keywords or a name/title filter — school or company filters alone are rejected. Do not combine a company NAME filter with limit 30; pass the company numeric id or URN (from Get LinkedIn Company) for the largest searches. Costs 10 credits for the first 10 results, +1 credit per further 10 (max 30; keyless and trial callers max 10). Results flagged is_anonymous are private profiles and cannot be fetched with Get LinkedIn Profile. Works keyless under a free per-IP daily budget. Read-only search, safe to repeat.',
    idempotent: true,
  },
  auth: veezeeAuth,
  requireAuth: false,
  props: {
    keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Free-text query: a name, a title, or both.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      description: 'Current job title filter.',
      required: false,
    }),
    school: Property.ShortText({
      displayName: 'School',
      required: false,
    }),
    current_company: Property.ShortText({
      displayName: 'Current Company',
      description:
        'Company name, slug, numeric id, or urn:li:fsd_company URN. Names are resolved automatically.',
      required: false,
    }),
    past_company: Property.ShortText({
      displayName: 'Past Company',
      description: 'Same accepted forms as Current Company.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'How many results to return (1-30). The first 10 are included in the base price; each further 10 add 1 credit. Keyless and trial callers are capped at 10. With a company NAME filter keep this at 20 or less; use the company numeric id or URN for 30.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'Cursor from a previous page. A cursor page is a new call priced by its own limit, so prefer a larger limit over paginating.',
      required: false,
    }),
    freshness: freshnessProp,
    max_credits: maxCreditsProp,
  },
  async run(context) {
    const {
      keywords,
      first_name,
      last_name,
      title,
      school,
      current_company,
      past_company,
      limit,
      cursor,
      freshness,
      max_credits,
    } = context.propsValue;

    if (
      ![keywords, first_name, last_name, title].some(
        (value) => typeof value === 'string' && value.trim().length > 0
      )
    ) {
      throw new Error(
        'Provide Keywords or at least one of First Name, Last Name, or Job Title. School or company filters alone are rejected by the API.'
      );
    }

    const limitNumber = limit == null ? undefined : Number(limit);
    if (
      limitNumber !== undefined &&
      (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 30)
    ) {
      throw new Error('Limit must be a whole number between 1 and 30.');
    }

    return veezeeApiCall({
      apiKey: context.auth?.secret_text || undefined,
      method: HttpMethod.GET,
      resourceUri: '/v1/linkedin/search',
      query: {
        keywords,
        first_name,
        last_name,
        title,
        school,
        current_company,
        past_company,
        limit,
        cursor,
        freshness,
        max_credits,
      },
    });
  },
});
