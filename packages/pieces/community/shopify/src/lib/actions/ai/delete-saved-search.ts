import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteSavedSearchOutputSchema } from '../../output-schemas/store';

export const shopifyAiDeleteSavedSearch = createAction({
  auth: shopifyAuth,
  name: 'delete_saved_search',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Saved Search',
  description: 'Delete a saved admin search (a saved filter view).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one saved search: a named filter view that staff saved in the Shopify admin (for example "Unfulfilled orders over $100" on the orders list). Staff lose that view for everyone; the records it matched are not touched. Get the id from list_saved_searches (id), choosing the resource_type the search belongs to. Needs the write access scope of the resource the search belongs to (for example write_orders for an order search). A repeat call fails because the search is gone.',
    idempotent: false,
  },
  props: {
    saved_search_id: Property.ShortText({
      displayName: 'Saved Search ID',
      description: 'The saved search id, numeric or "gid://shopify/SavedSearch/…" (see id from list_saved_searches).',
      required: true,
    }),
  },
  outputSchema: deleteSavedSearchOutputSchema,
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'SavedSearch', id: propsValue.saved_search_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      savedSearchDelete: { deletedSavedSearchId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteSavedSearch($input: SavedSearchDeleteInput!) { savedSearchDelete(input: $input) { deletedSavedSearchId userErrors { field message } } }`,
      variables: { input: { id } },
    });
    return {
      deleted_saved_search_id: data.savedSearchDelete?.deletedSavedSearchId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
