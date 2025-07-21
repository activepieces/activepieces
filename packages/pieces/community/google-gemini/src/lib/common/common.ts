import { httpClient, HttpMethod } from '@activepieces/pieces-common';
export const defaultLLM = 'gemini-1.5-flash';

export const allowedLLMs = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

export const getGeminiModelOptions = async ({ auth}: { auth: string | undefined | unknown }) => {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'Enter your API key first',
      options: [],
    };
  }

  try {
    const { body } = await httpClient.sendRequest<{
      models: { name: string; displayName: string }[];
    }>({
      method: HttpMethod.GET,
      url: `https://generativelanguage.googleapis.com/v1beta/models?key=${auth}`,
    });
    const options = body.models
      .filter((model) =>
        allowedLLMs.some((allowed) =>
          model.name.startsWith(`models/${allowed}`)
        )
      )
      .map((model) => ({
        label: model.displayName,
        value: model.name.replace('models/', ''),
      }));

    return {
      disabled: false,
      options,
    };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: "Couldn't load models, API key is invalid",
    };
  }
};
