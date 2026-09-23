import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMetafield,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiSetMetafields = createAction({
  auth: shopifyAuth,
  name: 'set_metafields',
  classification: 'WRITE',
  displayName: 'Set Metafields',
  description: 'Create or update up to 25 metafields on products, customers, orders and other resources.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets up to 25 metafield values in one all-or-nothing call: a metafield that does not exist is created and an existing one (same owner, namespace and key) gets the new value. Each entry needs the owner\'s full id (for example "gid://shopify/Product/123"; ids from this piece\'s get/list actions are already in this form), a namespace, a key and the value as a string (lists and references as a JSON string, for example "[\\"a\\",\\"b\\"]"). type (for example "single_line_text_field", "number_integer", "json", "list.single_line_text_field") is required for a new metafield without a definition. Optional compare_digest (from list_metafields or get_metafield) makes that entry fail if the value changed since you read it. A retry that reuses the same compare_digest after an earlier call went through fails as stale, even though the stored value is yours: re-read with get_metafield or list_metafields first and send the new compare_digest. Setting the same values again leaves the same state. Needs the write access scope of each owner type (for example write_products for products).',
    idempotent: true,
  },
  props: {
    metafields: Property.Array({
      displayName: 'Metafields',
      description: 'One entry per metafield to set, 1 to 25.',
      required: true,
      properties: {
        owner_id: Property.ShortText({
          displayName: 'Owner ID',
          description: 'Full id of the resource that owns the metafield, for example "gid://shopify/Product/123" or "gid://shopify/Customer/456".',
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
        value: Property.LongText({
          displayName: 'Value',
          description: 'The value as a string, for example "Hand wash only", "42" or "[\\"red\\",\\"blue\\"]" for a list.',
          required: true,
        }),
        type: Property.ShortText({
          displayName: 'Type',
          description: 'Metafield type, for example "single_line_text_field". Required for a new metafield that has no definition; see list_metafield_definition_types.',
          required: false,
        }),
        compare_digest: Property.ShortText({
          displayName: 'Compare Digest',
          description: 'Optional compare_digest from a previous read; the write fails if the stored value changed since.',
          required: false,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const metafields = buildMetafields(propsValue.metafields);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metafieldsSet: { metafields?: GqlMetafield[] | null } | null;
    }>({
      auth,
      query: `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { ${shopifyFields.METAFIELD_FIELDS} } userErrors { field message code elementIndex } } }`,
      variables: { metafields },
    });
    const items = (data.metafieldsSet?.metafields ?? []).map(shopifyMappers.mapMetafield);
    return {
      metafields: items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});

function buildMetafields(value: unknown): Record<string, unknown>[] {
  const rows = shopifyValues.readRecords(value);
  if (rows.length === 0) {
    throw new Error('Provide at least one metafield. Nothing was changed.');
  }
  if (rows.length > shopifyFields.MAX_METAFIELDS_PER_CALL) {
    throw new Error(
      `At most ${shopifyFields.MAX_METAFIELDS_PER_CALL} metafields per call; split them over several calls. Nothing was changed.`
    );
  }
  return rows.map((row, index) => {
    const namespace = shopifyValues.readText(row['namespace']);
    const key = shopifyValues.readText(row['key']);
    const content = row['value'];
    if (!namespace || !key || content === undefined || content === null) {
      throw new Error(`metafields[${index}] needs a namespace, a key and a value. Nothing was changed.`);
    }
    return shopifyValues.compact({
      ownerId: shopifyValues.requireGid({
        value: shopifyValues.readText(row['owner_id']),
        label: `metafields[${index}].owner_id`,
        example: 'gid://shopify/Product/123',
        hint: 'the owner type cannot be guessed from a bare number.',
      }),
      namespace,
      key,
      value: typeof content === 'string' ? content : JSON.stringify(content),
      type: shopifyValues.readText(row['type']),
      compareDigest: shopifyValues.readText(row['compare_digest']),
    });
  });
}
