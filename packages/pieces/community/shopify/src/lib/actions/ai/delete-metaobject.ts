import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteMetaobjectOutputSchema } from '../../output-schemas/content';

export const shopifyAiDeleteMetaobject = createAction({
  auth: shopifyAuth,
  name: 'delete_metaobject',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Metaobject Entry',
  description: 'Permanently delete one metaobject entry.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one metaobject entry. Metafields and other entries that reference it lose that reference. To hide an entry of a publishable type instead, use upsert_metaobject with status DRAFT. Cannot be undone; a repeat call fails because the entry is gone. Needs the write_metaobjects access scope.',
    idempotent: false,
  },
  outputSchema: deleteMetaobjectOutputSchema,
  props: {
    metaobject_id: Property.ShortText({
      displayName: 'Metaobject ID',
      description: 'The entry id, numeric or "gid://shopify/Metaobject/…". Find it with list_metaobjects.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Metaobject', id: propsValue.metaobject_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metaobjectDelete: { deletedId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteMetaobject($id: ID!) { metaobjectDelete(id: $id) { deletedId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_metaobject_id: data.metaobjectDelete?.deletedId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
