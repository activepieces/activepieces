import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlCustomerAccountPage,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;
import { listCustomerAccountPagesOutputSchema } from '../../output-schemas/store';

export const shopifyAiListCustomerAccountPages = createAction({
  auth: shopifyAuth,
  name: 'list_customer_account_pages',
  classification: 'SEARCH',
  displayName: 'List Customer Account Pages',
  description: 'List the pages of the store\'s customer account area.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the pages of the store\'s customer accounts area: built-in pages (orders, profile, settings; page_kind CustomerAccountNativePage with a page_type) and pages added by app extensions (page_kind CustomerAccountAppExtensionPage), each with id, handle, title and default cursor. This belongs to the new customer accounts; a store still on classic accounts may return nothing. Paged: pass end_cursor back as the cursor while has_next_page is true. The required access scope is not documented. Read-only.',
    idempotent: true,
  },
  props: {
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listCustomerAccountPagesOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customerAccountPages: GqlConnection<GqlCustomerAccountPage> | null;
    }>({
      auth,
      query: `query ListCustomerAccountPages($first: Int!, $after: String, $reverse: Boolean) { customerAccountPages(first: $first, after: $after, reverse: $reverse) { nodes { ${shopifyFields.CUSTOMER_ACCOUNT_PAGE_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.customerAccountPages,
      map: shopifyMappers.mapCustomerAccountPage,
      redactedFields,
    });
  },
});
