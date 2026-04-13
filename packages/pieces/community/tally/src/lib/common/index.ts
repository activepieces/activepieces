import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { tallyAuth } from '../..';

const TALLY_API_BASE = 'https://api.tally.so';

type TallyForm = { id: string; name: string; status: string };
type TallyFormsResponse = {
  items: TallyForm[];
  hasMore: boolean;
  page: number;
};
type TallyWebhookResponse = { id: string };

export const formsDropdown = Property.Dropdown<string, true, typeof tallyAuth>({
  auth: tallyAuth,
  displayName: 'Form',
  required: true,
  refreshers: [],
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Tally account first',
        options: [],
      };
    }

    const options: DropdownOption<string>[] = [];
    let page = 1;
    let hasMore = true;

    do {
      const response = await httpClient.sendRequest<TallyFormsResponse>({
        method: HttpMethod.GET,
        url: `${TALLY_API_BASE}/forms`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secret_text,
        },
        queryParams: { page: page.toString(), limit: '100' },
      });

      for (const form of response.body.items) {
        if (form.status !== 'DELETED') {
          options.push({ label: form.name, value: form.id });
        }
      }

      hasMore = response.body.hasMore;
      page++;
    } while (hasMore);

    return { disabled: false, placeholder: 'Select a form', options };
  },
});

export const tallyApiClient = {
  createWebhook: async (
    apiKey: string,
    formId: string,
    webhookUrl: string
  ): Promise<string> => {
    const response = await httpClient.sendRequest<TallyWebhookResponse>({
      method: HttpMethod.POST,
      url: `${TALLY_API_BASE}/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
      body: {
        formId,
        url: webhookUrl,
        eventTypes: ['FORM_RESPONSE'],
      },
    });
    return response.body.id;
  },

  deleteWebhook: async (apiKey: string, webhookId: string): Promise<void> => {
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${TALLY_API_BASE}/webhooks/${webhookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    });
  },
};
