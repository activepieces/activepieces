import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteScriptTagOutputSchema } from '../../output-schemas/store';

export const shopifyAiDeleteScriptTag = createAction({
  auth: shopifyAuth,
  name: 'delete_script_tag',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Script Tag',
  description: 'Stop the online store from loading a script tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one script tag, so the storefront stops loading that JavaScript file at once; whatever the script did (widgets, tracking, chat) stops working on the store. Recreate it with create_script_tag if needed. A repeat call fails because the tag is gone. Needs the write_script_tags access scope.',
    idempotent: false,
  },
  props: {
    script_tag_id: Property.ShortText({
      displayName: 'Script Tag ID',
      description: 'The script tag id, numeric or "gid://shopify/ScriptTag/…". Find it with list_script_tags.',
      required: true,
    }),
  },
  outputSchema: deleteScriptTagOutputSchema,
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'ScriptTag', id: propsValue.script_tag_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      scriptTagDelete: { deletedScriptTagId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteScriptTag($id: ID!) { scriptTagDelete(id: $id) { deletedScriptTagId userErrors { field message } } }`,
      variables: { id },
    });
    return {
      deleted_script_tag_id: data.scriptTagDelete?.deletedScriptTagId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
