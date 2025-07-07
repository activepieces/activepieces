import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { wufooApiCall } from './client';

interface WufooForm {
  Name: string;
  Hash: string;
  Url: string;
}

export const formIdentifier = Property.Dropdown({
  displayName: 'Form Identifier (Name or Hash)',
  description: 'Select a form by title (easy URL) or permanent hash.',
  required: true,
  refreshers: ['subdomain'],
  options: async ({ auth, propsValue }) => {
    const { subdomain } = propsValue as { subdomain?: string };

    if (!auth || !subdomain) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account and provide subdomain.',
      };
    }

    const response = await wufooApiCall<{ Forms: WufooForm[] }>({
      auth: {
        apiKey: auth as string,
        subdomain: subdomain as string,
      },
      method: HttpMethod.GET,
      resourceUri: `https://${subdomain}.wufoo.com/api/v3/forms.json`,
    });

    if (!response || !Array.isArray(response.Forms)) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No forms found or error fetching forms.',
      };
    }

    const options = response.Forms.map((form) => ({
      label: `${form.Name} (${form.Hash})`,
      value: form.Hash,
    }));

    return {
      disabled: false,
      options,
    };
  },
});
