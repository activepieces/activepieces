import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { docsbotCommon } from '../common/dropdown';

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
    language: Property.StaticDropdown({
      displayName: "Language",
      description: "Choose the language for your bot.",
      required: true,
      options: {
        options: [
          { label: "English", value: "en" },
          { label: "Japanese", value: "jp" },
        ],
      },
    }),
    model: Property.ShortText({
      displayName: "Model",
      description: "The OpenAI model (e.g., gpt-4.1, gpt-4o, gpt-4o-mini).",
      required: false,
    }),
    embeddingModel: Property.ShortText({
      displayName: "Embedding Model",
      description:
        "Embedding model (e.g., text-embedding-3-large, text-embedding-3-small, embed-v4.0).",
      required: false,
    }),
    copyFrom: Property.ShortText({
      displayName: "Copy From Bot ID",
      description: "Optional. If set, copies all sources from the given bot.",
      required: false,
    }),
  },

  async run({ propsValue, auth }) {
    const { teamId, name, description, privacy, language, model, embeddingModel, copyFrom } =
      propsValue;

    const request = {
      method: HttpMethod.POST,
      url: `https://docsbot.ai/api/teams/${teamId}/bots`,
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
      },
      body: {
        name,
        description,
        privacy,
        language,
        ...(model ? { model } : {}),
        ...(embeddingModel ? { embeddingModel } : {}),
        ...(copyFrom ? { copyFrom } : {}),
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});