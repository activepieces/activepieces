import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, linksMultiSelectDropdown } from '../common/props';

export const addConversationLinks = createAction({
  auth: frontAuth,
  name: 'add_conversation_links',
  displayName: 'Add Conversation Links',
  description: 'Link external references (URLs) to a conversation.',
  props: {
    conversation_id: conversationDropdown,
    link_ids: linksMultiSelectDropdown({
        displayName: 'Existing Link IDs',
        description: 'Select one or more existing links to add to the conversation. Use this OR the External URLs field.',
        required: false,
    }),
    link_external_urls: Property.Array({
        displayName: 'External URLs',
        description: 'Enter one or more external URLs to link. Front will create new links if they do not exist. Use this OR the Existing Link IDs field.',
        required: false,
    })
  },
  async run(context) {
    const { conversation_id, link_ids, link_external_urls } = context.propsValue;
    const token = context.auth;

    const useLinkIds = link_ids && link_ids.length > 0;
    const useExternalUrls = link_external_urls && link_external_urls.length > 0;

    if (useLinkIds && useExternalUrls) {
        throw new Error("Please use either 'Existing Link IDs' or 'External URLs', but not both.");
    }
    if (!useLinkIds && !useExternalUrls) {
        throw new Error("You must provide either 'Existing Link IDs' or 'External URLs'.");
    }

    const body = useLinkIds ? { link_ids } : { link_external_urls };

    await makeRequest(
        token,
        HttpMethod.POST,
        `/conversations/${conversation_id}/links`,
        body
    );

    return { success: true };
  },
});