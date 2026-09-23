import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlScriptTag,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetScriptTag = createAction({
  auth: shopifyAuth,
  name: 'get_script_tag',
  classification: 'READ',
  displayName: 'Get Script Tag',
  description: 'Get one script tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one script tag: the src URL of the JavaScript file the storefront loads, its display scope, cache flag and timestamps. Find ids with list_script_tags. Needs the read_script_tags access scope. Read-only.',
    idempotent: true,
  },
  props: {
    script_tag_id: Property.ShortText({
      displayName: 'Script Tag ID',
      description: 'The script tag id, numeric or "gid://shopify/ScriptTag/…". Find it with list_script_tags.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'ScriptTag', id: propsValue.script_tag_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      scriptTag: GqlScriptTag | null;
    }>({
      auth,
      query: `query GetScriptTag($id: ID!) { scriptTag(id: $id) { ${shopifyFields.SCRIPT_TAG_FIELDS} } }`,
      variables: { id },
    });
    if (!data.scriptTag) {
      throw new Error(`Script tag ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapScriptTag(data.scriptTag),
      redacted_fields: redactedFields,
    };
  },
});
