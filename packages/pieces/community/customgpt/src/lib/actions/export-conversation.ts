import { createAction, Property } from '@activepieces/pieces-framework';
import { customgptAuth } from '../common/auth';
import { projectId } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const exportConversation = createAction({
  auth: customgptAuth,
  name: 'export_conversation',
  displayName: 'Export Conversation',
  description:
    'Export a conversation with all messages, authors, feedbacks and metadata',
  props: {
    project_id: projectId,
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description: 'The session ID of the conversation to export',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/projects/${propsValue.project_id}/conversations/${propsValue.session_id}/export`
    );
  },
});
