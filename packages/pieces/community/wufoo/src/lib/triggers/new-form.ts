import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wufooAuth } from '../../index';
import { wufooApiCall } from '../common/client';

const LAST_FORM_IDS_KEY = 'wufoo-last-form-ids';

export const newFormTrigger = createTrigger({
  auth: wufooAuth,
  name: 'new_form_created',
  displayName: 'New Form Created',
  description: 'Triggers when a new form is created in your Wufoo account.',
  type: TriggerStrategy.POLLING,
  props: {},

  async onEnable(context) {
    const { apiKey, subdomain } = context.auth;

    const response = await wufooApiCall<{ Forms: any[] }>({
      auth: { apiKey, subdomain },
      method: HttpMethod.GET,
      resourceUri: '/forms.json',
    });

    const hashes = response.Forms.map((form) => form.Hash);
    await context.store.put<string[]>(LAST_FORM_IDS_KEY, hashes);
  },

  async onDisable() {
    // No cleanup needed for polling
  },

  async run(context) {
    const { apiKey, subdomain } = context.auth;
    const previousHashes = await context.store.get<string[]>(LAST_FORM_IDS_KEY) || [];

    const response = await wufooApiCall<{ Forms: any[] }>({
      auth: { apiKey, subdomain },
      method: HttpMethod.GET,
      resourceUri: '/forms.json',
    });

    const allForms = response.Forms;
    const currentHashes = allForms.map((f) => f.Hash);

    await context.store.put<string[]>(LAST_FORM_IDS_KEY, currentHashes);

    const newForms = allForms.filter((f) => !previousHashes.includes(f.Hash));
    return newForms;
  },

  async test(context) {
    const { apiKey, subdomain } = context.auth;

    const response = await wufooApiCall<{ Forms: any[] }>({
      auth: { apiKey, subdomain },
      method: HttpMethod.GET,
      resourceUri: '/forms.json',
    });

    return response.Forms.slice(0, 1);
  },

  sampleData: {
    Name: 'Contact Form',
    Hash: 's1afea8b1vk0jf7',
    Description: 'Basic contact form',
    DateCreated: '2025-07-07 10:00:00',
  },
});
