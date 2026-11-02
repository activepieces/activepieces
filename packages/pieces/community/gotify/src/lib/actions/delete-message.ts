import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { GotifyApiError, gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const deleteMessage = createAction({
  auth: gotifyAuth,
  name: 'delete_message',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Message',
  description: 'Delete one message by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Gotify message by its numeric id (from List Messages). Needs the Client Token. A repeat call on a message that no longer exists returns deleted=false, alreadyDeleted=true instead of failing.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.deleteMessage,
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'Numeric ID of the message to delete.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = gotifyClient.parseId({ value: propsValue.messageId, label: 'Message ID' });
    try {
      await gotifyClient.request({ auth: auth.props, method: HttpMethod.DELETE, path: `/message/${id}`, tokenKind: 'client' });
      return { id, deleted: true, alreadyDeleted: false };
    } catch (error) {
      if (error instanceof GotifyApiError && error.status === 404) {
        return { id, deleted: false, alreadyDeleted: true };
      }
      throw error;
    }
  },
});
