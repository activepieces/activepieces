import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteMetaobjectDefinitionOutputSchema } from '../../output-schemas/content';

export const shopifyAiDeleteMetaobjectDefinition = createAction({
  auth: shopifyAuth,
  name: 'delete_metaobject_definition',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Metaobject Definition',
  description: 'Permanently delete a metaobject type and every entry of it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one metaobject definition (a custom content type) AND every entry of that type; references to those entries from metafields break. Check metaobjects_count with list_metaobject_definitions and confirm before calling. To remove only some entries use delete_metaobject or bulk_delete_metaobjects. Cannot be undone; a repeat call fails because the definition is gone. Needs the write_metaobject_definitions access scope.',
    idempotent: false,
  },
  outputSchema: deleteMetaobjectDefinitionOutputSchema,
  props: {
    metaobject_definition_id: Property.ShortText({
      displayName: 'Metaobject Definition ID',
      description: 'The definition id, numeric or "gid://shopify/MetaobjectDefinition/…". Find it with list_metaobject_definitions.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'MetaobjectDefinition', id: propsValue.metaobject_definition_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metaobjectDefinitionDelete: { deletedId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteMetaobjectDefinition($id: ID!) { metaobjectDefinitionDelete(id: $id) { deletedId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_metaobject_definition_id: data.metaobjectDefinitionDelete?.deletedId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
