import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getPersonProfile = createAction({
  name: 'get_person_profile',
  auth: enrichlayerAuth,
  displayName: 'Get Person Profile',
  description:
    'Get structured data of a Person Profile from a professional network URL (1 credit)',
  props: {
    profile_url: Property.ShortText({
      displayName: 'Profile URL',
      description:
        'Professional network profile URL (e.g., https://linkedin.com/in/johnrmarty/). Provide only one of Profile URL, Twitter URL, or Facebook URL.',
      required: false,
    }),
    twitter_profile_url: Property.ShortText({
      displayName: 'Twitter/X Profile URL',
      description:
        'Twitter/X profile URL (e.g., https://x.com/johnrmarty/). Provide only one of Profile URL, Twitter URL, or Facebook URL.',
      required: false,
    }),
    facebook_profile_url: Property.ShortText({
      displayName: 'Facebook Profile URL',
      description:
        'Facebook profile URL (e.g., https://facebook.com/johnrmarty/). Provide only one of Profile URL, Twitter URL, or Facebook URL.',
      required: false,
    }),
    extra: Property.StaticDropdown({
      displayName: 'Include Extra Data',
      description:
        'Enrich with gender, birth date, industry, and interests (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    github_profile_id: Property.StaticDropdown({
      displayName: 'Include GitHub Profile ID',
      description: 'Enrich with GitHub ID (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    facebook_profile_id: Property.StaticDropdown({
      displayName: 'Include Facebook Profile ID',
      description: 'Enrich with Facebook ID (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    twitter_profile_id: Property.StaticDropdown({
      displayName: 'Include Twitter Profile ID',
      description: 'Enrich with Twitter ID (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    personal_contact_number: Property.StaticDropdown({
      displayName: 'Include Personal Contact Numbers',
      description: 'Enrich with personal numbers (+1 credit per number)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit per number)', value: 'include' },
        ],
      },
    }),
    personal_email: Property.StaticDropdown({
      displayName: 'Include Personal Emails',
      description: 'Enrich with personal emails (+1 credit per email)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit per email)', value: 'include' },
        ],
      },
    }),
    skills: Property.StaticDropdown({
      displayName: 'Include Skills',
      description: 'Include skills data (no extra credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (no extra credit)', value: 'include' },
        ],
      },
    }),
    inferred_salary: Property.StaticDropdown({
      displayName: 'Include Inferred Salary (Deprecated)',
      description: 'Include inferred salary range (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    use_cache: Property.StaticDropdown({
      displayName: 'Cache Strategy',
      description: 'Control how cached data is used',
      required: false,
      options: {
        options: [
          { label: 'If Present (default)', value: 'if-present' },
          { label: 'If Recent (+1 credit)', value: 'if-recent' },
        ],
      },
    }),
    fallback_to_cache: Property.StaticDropdown({
      displayName: 'Fallback to Cache',
      description: 'Fallback behavior if fetching a fresh profile fails',
      required: false,
      options: {
        options: [
          { label: 'On Error (default)', value: 'on-error' },
          { label: 'Never', value: 'never' },
        ],
      },
    }),
    live_fetch: Property.StaticDropdown({
      displayName: 'Live Fetch',
      description: 'Force a fresh profile fetch (+9 credits)',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Force (+9 credits)', value: 'force' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.PERSON_PROFILE,
      {
        profile_url: context.propsValue.profile_url,
        twitter_profile_url: context.propsValue.twitter_profile_url,
        facebook_profile_url: context.propsValue.facebook_profile_url,
        extra: context.propsValue.extra,
        github_profile_id: context.propsValue.github_profile_id,
        facebook_profile_id: context.propsValue.facebook_profile_id,
        twitter_profile_id: context.propsValue.twitter_profile_id,
        personal_contact_number: context.propsValue.personal_contact_number,
        personal_email: context.propsValue.personal_email,
        skills: context.propsValue.skills,
        inferred_salary: context.propsValue.inferred_salary,
        use_cache: context.propsValue.use_cache,
        fallback_to_cache: context.propsValue.fallback_to_cache,
        live_fetch: context.propsValue.live_fetch,
      },
    );
  },
});
