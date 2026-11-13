import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import { messageOutputSchema } from '../../output-schemas';

export const updateClickupMessage = createAction({
  auth: clickupAuth,
  name: 'update_message',
  classification: 'WRITE',
  description: 'Change the text of a chat message.',
  audience: 'both',
  aiMetadata: { description: 'Replace the content of an existing ClickUp chat message, identified by its message ID, within a workspace. Pick this to edit a message that was already posted; you must already know the message ID and supply the new content plus its format (Markdown or plain text). Overwrites the message content rather than appending, so re-running with the same content is effectively idempotent.', idempotent: false },
  displayName: 'Update Message',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'Returned by Get Channel Messages or Create Message.',
      displayName: 'Message ID',
      required: true,
    }),
    content: Property.LongText({
      description: 'ClickUp formats Markdown in the message.',
      displayName: 'Message',
      required: true,
      placeholder: 'e.g. The release is live',
    }),
    content_format: Property.StaticDropdown({
      description: 'How ClickUp should read the new text.',
      displayName: 'Content Format',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Markdown',
            value: 'text/md',
            icon: 'markdown',
          },
          {
            label: 'Plain Text',
            value: 'text/plain',
            icon: 'text',
          },
        ],
      },
      defaultValue: 'text/md',
    }),
  },

  outputSchema: messageOutputSchema,
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
