import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';

export const updateClickupMessage = createAction({
  auth: clickupAuth,
  name: 'update_message',
  description: 'Updates a message in a ClickUp channel',
  displayName: 'Update Message',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'ID of the message to update',
      displayName: 'Message ID',
      required: true,
    }),
    content: Property.LongText({
      description: 'Content of the message',
      displayName: 'Message Content',
      required: true,
    }),
    content_format: Property.StaticDropdown({
      description: 'Format of the message content',
      displayName: 'Message Content Format',
      required: true,
      options: {
        options: [
          { label: 'Markdown', value: 'text/md' },
          { label: 'Plain Text', value: 'text/plain' },
        ],
      },
    }),
  },

  async run(configValue) {
    const { workspace_id,  message_id, content, content_format } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.PATCH,
      `workspaces/${workspace_id}/chat/messages/${message_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {
        content,
        content_format,
      },
      {}
    );
    return response.body;
  },
});
