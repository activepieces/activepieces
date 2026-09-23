import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlTheme,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListThemes = createAction({
  auth: shopifyAuth,
  name: 'list_themes',
  classification: 'SEARCH',
  displayName: 'List Themes',
  description: 'List the online store\'s themes, optionally by role or name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the online store\'s themes with name, role and processing state. The theme with role MAIN is the live theme shoppers see; UNPUBLISHED and DEVELOPMENT themes are drafts. Filter by roles and/or exact names. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_themes access scope. Read-only.',
    idempotent: true,
  },
  props: {
    roles: Property.StaticMultiSelectDropdown({
      displayName: 'Roles',
      description: 'Only return themes with these roles, for example MAIN for the live theme. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'Live theme (MAIN)', value: 'MAIN' },
          { label: 'Unpublished', value: 'UNPUBLISHED' },
          { label: 'Development', value: 'DEVELOPMENT' },
          { label: 'Demo', value: 'DEMO' },
          { label: 'Archived', value: 'ARCHIVED' },
          { label: 'Locked', value: 'LOCKED' },
        ],
      },
    }),
    names: Property.Array({
      displayName: 'Names',
      description: 'Only return themes with these exact names, for example ["Dawn"].',
      required: false,
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const names = shopifyValues.readStringList(propsValue.names);
    const roles = propsValue.roles ?? [];
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      themes: GqlConnection<GqlTheme> | null;
    }>({
      auth,
      query: `query ListThemes($first: Int!, $after: String, $roles: [ThemeRole!], $names: [String!], $reverse: Boolean) { themes(first: $first, after: $after, roles: $roles, names: $names, reverse: $reverse) { nodes { ${shopifyFields.THEME_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        roles: roles.length > 0 ? roles : undefined,
        names: names && names.length > 0 ? names : undefined,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.themes,
      map: shopifyMappers.mapTheme,
      redactedFields,
    });
  },
});
