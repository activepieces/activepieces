import { createAction, Property } from '@activepieces/pieces-framework';
import { ackpostAuth } from '../common/auth';
import { createClient, callMcp, MCP_BASE_URL } from '../common/client';

export const publishDraft = createAction({
  auth: ackpostAuth,
  name: 'publish_draft',
  displayName: 'Publish Draft',
  description: 'Publishes an existing AckPost draft immediately.',
  props: {
    draftId: Property.ShortText({
      displayName: 'Draft ID',
      description: 'The ID of the draft to publish.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createClient(MCP_BASE_URL, auth.apiKey);
    return callMcp(client, 'draft/publish', {
      workspace_id: auth.workspaceId,
      draft_id: propsValue.draftId,
    });
  },
});
