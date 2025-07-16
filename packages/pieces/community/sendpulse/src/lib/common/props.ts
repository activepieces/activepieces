import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendpulseApiCall } from './client';
import { sendpulseAuth } from './auth';

type SendpulseMailingList = {
  id: number;
  name: string;
  status_explain: string;
};

export const mailingListDropdown = Property.Dropdown({
  displayName: 'Mailing List',
  description: 'Select one of your SendPulse mailing lists',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const typedAuth = auth as { clientId?: string; clientSecret?: string };
    if (!typedAuth.clientId || !typedAuth.clientSecret) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your SendPulse account.',
      };
    }

    try {
      const lists = await sendpulseApiCall<SendpulseMailingList[]>({
        auth: auth as import('./client').SendPulseAuthProps,
        method: HttpMethod.GET,
        resourceUri: '/addressbooks?limit=100&offset=0',
      });

      if (!lists.length) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No mailing lists found in your account.',
        };
      }

      return {
        disabled: false,
        options: lists.map((list) => ({
          label: `${list.name} (${list.status_explain})`,
          value: list.id,
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load mailing lists: ${error.message}`,
      };
    }
  },
});
