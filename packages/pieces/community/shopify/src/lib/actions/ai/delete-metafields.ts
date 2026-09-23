import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyFields, shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiDeleteMetafields = createAction({
  auth: shopifyAuth,
  name: 'delete_metafields',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Metafields',
  description: 'Delete metafields by owner, namespace and key.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes up to 25 metafield values, each identified by the owner\'s full id, namespace and key. The metafield definition (if any) is kept; only the stored values go. A metafield that does not exist is reported in not_found instead of failing, so repeating the call is safe. Cannot be undone; read values with list_metafields first if they may be needed. Needs the write access scope of each owner type (for example write_products for products).',
    idempotent: true,
  },
  props: {
    metafields: Property.Array({
      displayName: 'Metafields',
      description: 'One entry per metafield to delete, 1 to 25.',
      required: true,
      properties: {
        owner_id: Property.ShortText({
          displayName: 'Owner ID',
          description: 'Full id of the resource that owns the metafield, for example "gid://shopify/Product/123".',
          required: true,
        }),
        namespace: Property.ShortText({
          displayName: 'Namespace',
          description: 'Metafield namespace, for example "custom".',
          required: true,
        }),
        key: Property.ShortText({
          displayName: 'Key',
          description: 'Metafield key, for example "care_instructions".',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const identifiers = buildIdentifiers(propsValue.metafields);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metafieldsDelete: {
        deletedMetafields?: ({ ownerId?: string | null; namespace?: string | null; key?: string | null } | null)[] | null;
      } | null;
    }>({
      auth,
      query: `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) { metafieldsDelete(metafields: $metafields) { deletedMetafields { ownerId namespace key } userErrors { field message } } }`,
      variables: { metafields: identifiers },
    });
    const results = data.metafieldsDelete?.deletedMetafields ?? [];
    const deleted = identifiers.filter((_, index) => results[index]);
    const notFound = identifiers.filter((_, index) => !results[index]);
    return {
      deleted: deleted.map(toOutput),
      not_found: notFound.map(toOutput),
      deleted_count: deleted.length,
      redacted_fields: redactedFields,
    };
  },
});

function buildIdentifiers(value: unknown): Identifier[] {
  const rows = shopifyValues.readRecords(value);
  if (rows.length === 0) {
    throw new Error('Provide at least one metafield. Nothing was deleted.');
  }
  if (rows.length > shopifyFields.MAX_METAFIELDS_PER_CALL) {
    throw new Error(
      `At most ${shopifyFields.MAX_METAFIELDS_PER_CALL} metafields per call; split them over several calls. Nothing was deleted.`
    );
  }
  return rows.map((row, index) => {
    const namespace = shopifyValues.readText(row['namespace']);
    const key = shopifyValues.readText(row['key']);
    if (!namespace || !key) {
      throw new Error(`metafields[${index}] needs a namespace and a key. Nothing was deleted.`);
    }
    return {
      ownerId: shopifyValues.requireGid({
        value: shopifyValues.readText(row['owner_id']),
        label: `metafields[${index}].owner_id`,
        example: 'gid://shopify/Product/123',
        hint: 'the owner type cannot be guessed from a bare number.',
      }),
      namespace,
      key,
    };
  });
}

function toOutput(identifier: Identifier) {
  return {
    owner_id: identifier.ownerId,
    namespace: identifier.namespace,
    key: identifier.key,
  };
}

type Identifier = {
  ownerId: string;
  namespace: string;
  key: string;
};
