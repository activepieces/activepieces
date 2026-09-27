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

export const shopifyAiCreateScriptTag = createAction({
  auth: shopifyAuth,
  name: 'create_script_tag',
  classification: 'WRITE',
  displayName: 'Create Script Tag',
  description: 'Load a remote JavaScript file on every online store page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a script tag so the online store loads the given remote JavaScript file on every storefront page, and returns it. The script runs in every shopper\'s browser with full access to the page, so only add a script URL the merchant explicitly asked for and trusts, and say which URL you are adding. It only works on vintage themes; Online Store 2.0 themes ignore script tags. The display scope is always ONLINE_STORE (the order-status scopes are deprecated). Each call adds another tag, even for the same URL, so check list_script_tags with src first. Needs the write_script_tags access scope.',
    idempotent: false,
  },
  props: {
    src: Property.ShortText({
      displayName: 'Script URL',
      description: 'HTTPS URL of the JavaScript file, for example "https://cdn.example.com/widget.js".',
      required: true,
    }),
    cache: shopifyProps.booleanChoice({
      displayName: 'Cache',
      description: 'Yes lets Shopify serve the script from its CDN cache (changes to the file then show up with a delay). Leave empty for Shopify\'s default.',
    }),
  },
  outputSchema: scriptTagOutputSchema,
  async run({ auth, propsValue }) {
    const src = readScriptUrl(propsValue.src);
    const input = shopifyValues.compact({
      src,
      displayScope: 'ONLINE_STORE',
      cache: shopifyValues.toBooleanChoice(propsValue.cache),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      scriptTagCreate: { scriptTag: GqlScriptTag | null } | null;
    }>({
      auth,
      query: `mutation CreateScriptTag($input: ScriptTagInput!) { scriptTagCreate(input: $input) { scriptTag { ${shopifyFields.SCRIPT_TAG_FIELDS} } userErrors { field message } } }`,
      variables: { input },
    });
    const tag = data.scriptTagCreate?.scriptTag;
    if (!tag) {
      throw new Error('Shopify did not return the new script tag.');
    }
    return {
      ...shopifyMappers.mapScriptTag(tag),
      redacted_fields: redactedFields,
    };
  },
});

function readScriptUrl(value: string | undefined | null): string {
  const src = shopifyValues.nonEmpty(value);
  if (!src || !/^https:\/\/\S+$/i.test(src)) {
    throw new Error('src must be an https:// URL of a JavaScript file. Nothing was created.');
  }
  return src;
}
