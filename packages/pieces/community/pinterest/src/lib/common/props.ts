import { DropdownOption, Property } from "@activepieces/pieces-framework";
import { makeRequest } from ".";
import { HttpMethod } from "@activepieces/pieces-common";

export const boardIdDropdown = Property.Dropdown({
  displayName: 'board Id',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder:
          'Please connect your account',
        options: [],
      };
    }

    const apiKey = auth as string;
    const boards = await makeRequest(apiKey, HttpMethod.GET, '/boards');

    const options: DropdownOption<string>[] = boards.map((form: any) => ({
      label: boards.name,
      value: boards.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});


export const pinIdDropdown = Property.Dropdown({
  displayName: 'pin Id',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account',
        options: [],
      };
    }

    const apiKey = auth as string;
    const pins = await makeRequest(apiKey, HttpMethod.GET, '/pins');

    const options: DropdownOption<string>[] = pins.map((form: any) => ({
      label: pins.title,
      value: pins.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});