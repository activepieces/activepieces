import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wufooApiCall } from './client';

interface WufooForm {
  Name: string;
  Hash: string;
  Url: string;
}

export const formIdentifier = Property.Dropdown({
  displayName: 'Form Identifier (Name and Hash)',
  description: 'Select a Wufoo form to work with.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const { apiKey, subdomain } = auth as { apiKey: string; subdomain: string };

    if (!apiKey || !subdomain) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Wufoo account.',
      };
    }

    let response: { Forms: WufooForm[] };

    try {
      response = await wufooApiCall<{ Forms: WufooForm[] }>({
        auth: { apiKey, subdomain },
        method: HttpMethod.GET,
        resourceUri: '/forms.json',
      });
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching forms: ${(e as Error).message}`,
      };
    }

    const forms = Array.isArray(response.Forms) ? response.Forms : [];

    if (forms.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No forms found in your account.',
      };
    }

    return {
      disabled: false,
      options: forms.map((form) => ({
        label: `${form.Name} (${form.Hash})`,
        value: form.Hash,
      })),
    };
  },
});
