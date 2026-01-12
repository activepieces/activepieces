import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instabaseAuth } from '../../index';
import { makeInstabaseApiCall } from '../common';

interface ConverseWithDocumentResponse {
  prompt_id: string | null;
  answer: string | null;
}

export const converseWithDocumentAction = createAction({
  auth: instabaseAuth,
  name: 'converse_with_document',
  displayName: 'Converse with Document',
  description: 'Ask a question about a document in a conversation',
  props: {
    conversation_id: Property.Dropdown({
      auth: instabaseAuth,
      displayName: 'Conversation',
      description: 'Select the conversation',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
          };
        }
        try {
          const response = await makeInstabaseApiCall<{ conversations: Array<{ id: string; name: string; description?: string }> }>(
            auth,
            '/v2/conversations',
            HttpMethod.GET
          );

          const options = response.conversations.map(conversation => ({
            label: conversation.name,
            value: conversation.id,
          }));

          return {
            options,
            disabled: false,
          };
        } catch (error) {
          return {
            options: [],
            disabled: true,
          };
        }
      },
    }),
    question: Property.LongText({
      displayName: 'Question',
      description: 'The question to ask the document',
      required: true,
    }),
    document_ids: Property.MultiSelectDropdown({
      auth: instabaseAuth,
      displayName: 'Documents',
      description: 'Select the documents to query',
      required: true,
      refreshers: ['conversation_id'],
      options: async ({ auth, conversation_id }) => {
        if (!conversation_id || !auth) {
          return {
            options: [],
            disabled: true,
          };
        }

        try {
          const response = await makeInstabaseApiCall<{
            documents: Array<{ id: number; name: string; state: string; uploadTimestamp: string }>
          }>(
            auth,
            `/v2/conversations/${conversation_id}`,
            HttpMethod.GET
          );

          const options = response.documents
            .filter(doc => doc.state === 'PROCESSED')
            .map(document => ({
              label: document.name,
              value: document.id,
            }));

          return {
            options,
            disabled: false,
          };
        } catch (error) {
          return {
            options: [],
            disabled: true,
          };
        }
      },
    }),
    mode: Property.StaticDropdown({
      displayName: 'Model Mode',
      description: 'The model to use to answer the question',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Advanced', value: 'advanced' },
          { label: 'Fast Mode', value: 'fast_mode' },
        ],
      },
      defaultValue: 'default',
    }),
    fast_mode: Property.Checkbox({
      displayName: 'Fast Mode',
      description: 'Enable fast mode for quicker responses',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      conversation_id,
      question,
      document_ids,
      mode = 'default',
      fast_mode = false,
    } = propsValue;

    const endpoint = `/v2/conversations/${conversation_id}/prompts`;

    const requestBody = {
      question,
      document_ids,
      mode,
      fast_mode,
    };

    const response = await makeInstabaseApiCall<ConverseWithDocumentResponse>(
      auth as any,
      endpoint,
      HttpMethod.POST,
      requestBody
    );

    return response;
  },
});
