import { createAction, Property } from '@activepieces/pieces-framework';
import { SiteSpeakAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { chatbotIdDropdown, finetuneIdDropdown } from '../common/dropdown';

export const deleteFinetune = createAction({
  name: 'delete_finetune',
  displayName: 'Delete Finetune',
  description: 'Deletes a fine-tune entry from the selected chatbot.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a specific fine-tune entry from a SiteSpeakAI chatbot, identified by chatbot ID and fine-tune ID. Use to undo or clean up a previously added Q&A. Idempotent in effect: once the entry is gone, repeating the call leaves it absent.',
    idempotent: true,
  },
  auth: SiteSpeakAuth,
  props: {
    chatbotId: chatbotIdDropdown,
    finetuneId: finetuneIdDropdown,
  },
  async run({ auth, propsValue }) {
    const props = propsValue as { chatbotId: string; finetuneId: string };

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.DELETE,
      `/${props.chatbotId}/finetunes/${props.finetuneId}`
    );

    return {
      success: true,
      data: response,
    };
  },
});
