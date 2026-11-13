import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlScriptTag,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { scriptTagOutputSchema } from '../../output-schemas/store';

export const shopifyAiUpdateScriptTag = createAction({
  auth: shopifyAuth,
  name: 'update_script_tag',
  classification: 'WRITE',
  displayName: 'Update Script Tag',
  description: 'Change the script URL or cache flag of a script tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the src URL and/or the cache flag of one script tag and returns it; what you leave empty keeps its value. A new src makes every storefront page load a different script, so only use a URL the merchant explicitly asked for and trusts. The display scope is not changed. Repeating the same update leaves the same state. Needs the write_script_tags access scope. Shopify no longer lets many apps create or update script tags: if it answers "This app can\'t create or update script tags", do not retry; a theme app extension is needed instead.',
    idempotent: true,
  },
  props: {
    script_tag_id: Property.ShortText({
      displayName: 'Script Tag ID',
      description: 'The script tag id, numeric or "gid://shopify/ScriptTag/…". Find it with list_script_tags.',
      required: true,
    }),
    src: Property.ShortText({
      displayName: 'Script URL',
      description: 'New HTTPS URL of the JavaScript file.',
      required: false,
    }),
    cache: shopifyProps.booleanChoice({
      displayName: 'Cache',
      description: 'Yes serves the script from Shopify\'s CDN cache, No loads it from the source each time. Leave empty to keep the current setting.',
    }),
  },
  outputSchema: scriptTagOutputSchema,
  async run({ auth, propsValue }) {
    const src = shopifyValues.nonEmpty(propsValue.src);
    if (src !== undefined && !/^https:\/\/\S+$/i.test(src)) {
      throw new Error('src must be an https:// URL of a JavaScript file. Nothing was changed.');
    }
    const input = shopifyValues.compact({
      src,
      cache: shopifyValues.toBooleanChoice(propsValue.cache),
    });
    if (Object.keys(input).length === 0) {
      throw new Error('Nothing to update: provide a new src or a cache choice. Nothing was changed.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'ScriptTag', id: propsValue.script_tag_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      scriptTagUpdate: { scriptTag: GqlScriptTag | null } | null;
    }>({
      auth,
      query: `mutation UpdateScriptTag($id: ID!, $input: ScriptTagInput!) { scriptTagUpdate(id: $id, input: $input) { scriptTag { ${shopifyFields.SCRIPT_TAG_FIELDS} } userErrors { field message } } }`,
      variables: { id, input },
    });
    const tag = data.scriptTagUpdate?.scriptTag;
    if (!tag) {
      throw new Error('Shopify did not return the updated script tag.');
    }
    return {
      ...shopifyMappers.mapScriptTag(tag),
      redacted_fields: redactedFields,
    };
  },
});
