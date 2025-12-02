import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export interface PromptMateApp {
  appId: string;
  appName: string;
  creditEstimate: number;
  dataFields: string[];
}

export const getApps = async (auth: string): Promise<PromptMateApp[]> => {
  const response = await httpClient.sendRequest<PromptMateApp[]>({
    method: HttpMethod.GET,
    url: 'https://api.promptmate.io/v1/apps',
    headers: {
      'x-api-key': auth,
    },
  });

  return response.body;
};

export const getAppDropdownOptions = async (auth: string) => {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'Enter your API key first',
      options: [],
    };
  }

  try {
    const apps = await getApps(auth);
    return {
      disabled: false,
      options: apps.map((app) => ({
        label: app.appName,
        value: app.appId,
      })),
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: "Couldn't load apps, API key is invalid",
    };
  }
};
