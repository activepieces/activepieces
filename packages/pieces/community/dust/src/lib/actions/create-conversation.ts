import { createAction, Property } from '@activepieces/pieces-framework';
import {
  assistantProp,
  usernameProp,
  timezoneProp,
  getConversationContent,
  timeoutProp,
  createClient,
} from '../common';
import { dustAuth, DustAuthType } from '../..';
import mime from 'mime-types';
import { PublicPostConversationsRequestBody } from '@dust-tt/client';

export const createConversation = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createConversation',
  displayName: 'Create conversation',
  description: 'Create a new conversation with a specific Dust assistant',
  auth: dustAuth,
  props: {
    assistant: assistantProp,
    username: usernameProp,
    timezone: timezoneProp,
    title: Property.ShortText({ displayName: 'Title', required: false }),
    query: Property.LongText({ displayName: 'Query', required: false }),
    fragment: Property.File({ displayName: 'Fragment', required: false }),
    fileId: Property.ShortText({
      displayName: 'File ID',
      required: false,
      description:
        'ID of the file to be added to the conversation (takes precedence over Fragment)',
    }),
    fragmentName: Property.ShortText({
      displayName: 'Fragment/file name',
      required: false,
    }),
    timeout: timeoutProp,
  },
  async run({ auth, propsValue }) {
    const client = createClient(auth as DustAuthType);

    const payload: PublicPostConversationsRequestBody = {
      visibility: 'unlisted',
      title: propsValue.title || null,
    };

    if (propsValue.query) {
      payload.message = {
        content: propsValue.query,
        mentions: [{ configurationId: propsValue.assistant }],
        context: {
          timezone: propsValue.timezone,
          username: propsValue.username,
          email: null,
          fullName: null,
          profilePictureUrl: null,
        },
      };
    }

    if (propsValue.fileId) {
      payload.contentFragment = {
        title: propsValue.fragmentName || '',
        fileId: propsValue.fileId,
      };
    } else if (propsValue.fragment) {
      const mimeType = propsValue.fragmentName
        ? mime.lookup(propsValue.fragmentName) ||
          mime.lookup(propsValue.fragment.filename)
        : mime.lookup(propsValue.fragment.filename);
      payload.contentFragment = {
        title: propsValue.fragmentName || propsValue.fragment.filename,
        content: propsValue.fragment.data.toString('utf-8'),
        contentType: mimeType || 'text/plain',
        context: null,
        url: null,
      };
    }

    const response = await client.createConversation(payload);

    if (response.isErr()) {
      throw new Error(`API Error: ${response.error.message}`);
    }

    const conversationId = response.value.conversation.sId;
    if (propsValue.query) {
      return await getConversationContent(
        conversationId,
        propsValue.timeout,
        auth as DustAuthType
      );
    } else {
      return response.value;
    }
  },
});
