import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMetaobject,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetMetaobject = createAction({
  auth: shopifyAuth,
  name: 'get_metaobject',
  classification: 'READ',
  displayName: 'Get Metaobject Entry',
  description: 'Get one metaobject entry with all its field values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one metaobject entry by id: type, handle, display name, publish status (DRAFT or ACTIVE when the type is publishable), online store template suffix, its definition, every field value (fields and a values map keyed by field key) and dates. Needs the read_metaobjects access scope. Read-only.',
    idempotent: true,
  },
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
      metaobject: GqlMetaobject | null;
    }>({
      auth,
      query: `query GetMetaobject($id: ID!) { metaobject(id: $id) { ${shopifyFields.METAOBJECT_FIELDS} } }`,
      variables: { id },
    });
    if (!data.metaobject) {
      throw new Error(`Metaobject ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapMetaobject(data.metaobject),
      redacted_fields: redactedFields,
    };
  },
});
