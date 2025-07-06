import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { makeRequest } from '.';
import { HttpMethod } from '@activepieces/pieces-common';



export const sessionIdDropdown = Property.Dropdown({
  displayName: 'Session',
  description: 'Select a session to create the window in',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your airtop account',
        options: [],
      };
    }

    const apiKey = auth as string;
    const sessions = await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/sessions?offset=0&limit=50',
      undefined
    );

    const options: DropdownOption<string>[] = sessions.data?.map((session: any) => ({
      label: `Session ${session.id} (${session.status})`,
      value: session.id,
    })) || [];

    return {
      disabled: false,
      options,
    };
  },
});

export const windowIdDropdown = Property.Dropdown({
  displayName: 'Window',
  description: 'Select a window to take screenshot of',
  required: true,
  refreshers: ['sessionId'],
  options: async ({ auth, sessionId }) => {
    if (!auth || !sessionId) {
      return {
        disabled: true,
        placeholder: 'Please select a session first',
        options: [],
      };
    }

    const apiKey = auth as string;
    const windows = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/sessions/${sessionId}/windows`,
      undefined
    );

    const options: DropdownOption<string>[] = windows.data?.map((window: any) => ({
      label: `Window ${window.id} (${window.url || 'No URL'})`,
      value: window.id,
    })) || [];

    return {
      disabled: false,
      options,
    };
  },
});
