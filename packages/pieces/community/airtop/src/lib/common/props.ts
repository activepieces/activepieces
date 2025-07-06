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

    const options: DropdownOption<string>[] =
      sessions.data.sessions?.map((session: any) => ({
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

    const options: DropdownOption<string>[] =
      windows.data.windows?.map((window: any) => ({
        label: `Window ${window.windowId} (${window.url || 'No URL'})`,
        value: window.windowId,
      })) || [];

    return {
      disabled: false,
      options,
    };
  },
});

export const fileIdDropdown = Property.Dropdown({
  displayName: 'File',
  description: 'Select a file to use in the action',
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
    const files = await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/files?offset=0&limit=50',
      undefined
    );

    const options: DropdownOption<string>[] =
      files.data.files?.map((file: any) => ({
        label: `${file.fileName} (${file.fileType}) - ${file.id}`,
        value: file.id,
      })) || [];

    return {
      disabled: false,
      options,
    };
  },
});

export const sessionIdsMultiselectDropdown = Property.MultiSelectDropdown({
  displayName: 'Session IDs',
  description: 'Select one or more sessions to make the file available on',
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

    const options =
      sessions.data.sessions?.map((session: any) => ({
        label: `Session ${session.id} (${session.status})`,
        value: session.id,
      })) || [];

    return {
      disabled: false,
      options,
    };
  },
});