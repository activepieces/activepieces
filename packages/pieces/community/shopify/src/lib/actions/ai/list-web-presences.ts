import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlWebPresence,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 60;
import { listWebPresencesOutputSchema } from '../../output-schemas/store';

export const shopifyAiListWebPresences = createAction({
  auth: shopifyAuth,
  name: 'list_web_presences',
  classification: 'SEARCH',
  displayName: 'List Markets Web Presences',
  description: 'List the store\'s Markets web presences (the domains and subfolders markets are sold through).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s Markets web presences: the domains or subfolders (for example example.com/fr-ca) through which markets\' shoppers reach the storefront. Each item has id (what delete_web_presence takes), kind ("domain" or "subfolder"), subfolder_suffix (for example "fr-ca", empty for a domain presence), domain_id / domain_host / domain_url (empty for a subfolder presence, which has no domain of its own), default_locale and root_urls (the storefront URL per language). A store that does not use Markets with extra domains or subfolders may return only its primary domain presence or nothing. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_markets access scope. Read-only.',
    idempotent: true,
  },
  props: {
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listWebPresencesOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      webPresences: GqlConnection<GqlWebPresence> | null;
    }>({
      auth,
      query: `query ListWebPresences($first: Int!, $after: String, $reverse: Boolean) { webPresences(first: $first, after: $after, reverse: $reverse) { nodes { ${shopifyFields.WEB_PRESENCE_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.webPresences,
      map: shopifyMappers.mapWebPresence,
      redactedFields,
    });
  },
});
