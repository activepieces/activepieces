import { createAction, Property } from "@activepieces/pieces-framework";
import { SiteSpeakAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { finetuneIdDropdown } from "../common/dropdown";


export const deleteFinetune = createAction({
  name: 'delete_finetune',
  displayName: 'Delete Finetune Entry',
  description: 'Deletes a fine-tune entry from the selected chatbot.',
  auth: SiteSpeakAuth,
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      required: true,
      description: 'ID of the chatbot for which to create the finetune (from your SiteSpeakAI account).',
    }),
    finetuneId: finetuneIdDropdown,
  },
  async run({ auth, propsValue }) {

    const response = await makeRequest(
      auth as string,
      HttpMethod.DELETE,
      `/${propsValue.chatbotId}/finetunes/${propsValue.finetuneId}`
    );

    return response;
  },
});
