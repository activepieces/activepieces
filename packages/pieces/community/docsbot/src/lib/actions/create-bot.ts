import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { docsbotCommon } from '../common/dropdown';
import { makeRequest } from '../common/client';

export const createBot = createAction({
  auth: DocsBotAuth,
  name: 'createBot',
  displayName: 'Create Bot',
  description: 'Create a new bot',
  props: {
    teamId: docsbotCommon.teamId,
    name: Property.ShortText({
      displayName: "Bot Name",
      description: "The name of your bot",
      required: true,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "A description of your bot, shown in embeds and links.",
      required: true,
    }),
    privacy: Property.StaticDropdown({
      displayName: "Privacy",
      description: "Choose whether the bot is public or private.",
      required: true,
      options: {
        options: [
          { label: "Public", value: "public" },
          { label: "Private", value: "private" },
        ],
      },
    }),
    language: docsbotCommon.language,

    model: Property.StaticDropdown({
      displayName: "Model",
      description:
        "Select the LLM model. GPT-4.1 offers advanced long-context and reasoning; GPT-4o is multimodal with strong performance.",
      required: false,
      options: {
        options: [
          { label: "GPT-4.1", value: "gpt-4.1" },
          { label: "GPT-4o", value: "gpt-4o" },
        ],
      },
    }),
    embeddingModel: Property.StaticDropdown({
      displayName: "Embedding Model",
      description:
        "Select the embedding model: small for efficiency, large for English accuracy, or multilingual models.",
      required: false,
      options: {
        options: [
          { label: "text-embedding-3-small", value: "text-embedding-3-small" },
          { label: "text-embedding-3-large", value: "text-embedding-3-large" },
          { label: "text-embedding-ada-002", value: "text-embedding-ada-002" },
          { label: "embed-multilingual-v3.0", value: "embed-multilingual-v3.0" },
          { label: "embed-v4.0", value: "embed-v4.0" },
        ],
      },
    }),
    copyFrom: Property.ShortText({
      displayName: "Copy From Bot ID",
      description: "Optional. If set, copies all sources from the given bot.",
      required: false,
    }),
  },

  async run({ propsValue, auth }) {
    const {
      teamId,
      name,
      description,
      privacy,
      language,
      model,
      embeddingModel,
      copyFrom,
    } = propsValue;

    const body: Record<string, any> = {
      name,
      description,
      privacy,
      language,
    };

    if (model) body['model'] = model;
    if (embeddingModel) body['embeddingModel'] = embeddingModel;
    if (copyFrom) body['copyFrom'] = copyFrom;

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/api/teams/${teamId}/bots`,
      undefined,
      body
    );

    return response;
  },
});