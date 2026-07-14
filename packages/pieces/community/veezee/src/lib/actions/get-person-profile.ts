import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  freshnessProp,
  maxCreditsProp,
  veezeeApiCall,
  veezeeAuth,
} from '../common';

export const getPersonProfileAction = createAction({
  name: 'get_person_profile',
  displayName: 'Get LinkedIn Profile',
  description:
    'Fetch a LinkedIn person profile by URL, slug, or URN. Costs 4 credits; the first 2 profile sections are included, each extra section adds 2 credits. Needs a free Veezee API key (self-minted, no signup or card).',
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch one person's LinkedIn profile by profile URL, slug (after /in/), or urn:li:fsd_profile URN. Use when you already know which person; to find people by name, title, or company use Search LinkedIn People instead. Costs 4 credits base; the first 2 requested sections are included, each extra section adds 2 credits. Needs a free self-minted Veezee API key (no signup or card); the free tier is 20 credits/day per network location. Read-only lookup, safe to repeat.",
    idempotent: true,
  },
  auth: veezeeAuth,
  requireAuth: true,
  props: {
    identifier: Property.ShortText({
      displayName: 'Person Identifier',
      description:
        'LinkedIn profile URL (e.g. https://www.linkedin.com/in/williamhgates), the slug after /in/ (e.g. williamhgates), or a urn:li:fsd_profile URN.',
      required: true,
    }),
    sections: Property.StaticMultiSelectDropdown({
      displayName: 'Profile Sections',
      description:
        'Extra profile sections to include. The first 2 are included in the base price; each section beyond 2 adds 2 credits (max 4).',
      required: false,
      options: {
        options: [
          { label: 'About', value: 'about' },
          { label: 'Experience', value: 'experience' },
          { label: 'Education', value: 'education' },
          { label: 'Skills', value: 'skills' },
        ],
      },
    }),
    freshness: freshnessProp,
    max_credits: maxCreditsProp,
  },
  async run(context) {
    const { identifier, sections, freshness, max_credits } =
      context.propsValue;

    return veezeeApiCall({
      apiKey: context.auth?.secret_text || undefined,
      method: HttpMethod.GET,
      resourceUri: '/v1/linkedin/profiles',
      query: {
        identifier,
        sections:
          sections && sections.length > 0 ? sections.join(',') : undefined,
        freshness,
        max_credits,
      },
    });
  },
});
