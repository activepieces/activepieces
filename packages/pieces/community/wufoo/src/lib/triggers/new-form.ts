import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wufooAuth } from '../../index';
import { wufooApiCall } from '../common/client';
import { Property } from '@activepieces/pieces-framework';

const LAST_FORM_IDS_KEY = 'wufoo-last-form-ids';

export const newFormTrigger = createTrigger({
  auth: wufooAuth,
  name: 'new-form-created',
  displayName: 'New Form Created',
  description: 'Triggers when a new form is created in the Wufoo account.',
  type: TriggerStrategy.POLLING,
  props: {
    subdomain: Property.ShortText({
      displayName: 'Wufoo Subdomain',
      description: 'Your Wufoo account subdomain (e.g., `fishbowl` in `https://fishbowl.wufoo.com`).',
      required: true,
    }),
  },
  async onEnable(context) {
    const { subdomain } = context.propsValue;

    const response = await wufooApiCall<{ Forms: any[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `https://${subdomain}.wufoo.com/api/v3/forms.json`,
    });

    const hashes = response.Forms.map((f) => f.Hash);
    await context.store.put<string[]>(LAST_FORM_IDS_KEY, hashes);
  },
  async onDisable() {
  },
  async run(context) {
    const { subdomain } = context.propsValue;

    const prevHashes = await context.store.get<string[]>(LAST_FORM_IDS_KEY) || [];

    const response = await wufooApiCall<{ Forms: any[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `https://${subdomain}.wufoo.com/api/v3/forms.json`,
    });

    const allForms = response.Forms;
    const currentHashes = allForms.map((f) => f.Hash);

    await context.store.put<string[]>(LAST_FORM_IDS_KEY, currentHashes);

    const newForms = allForms.filter((f) => !prevHashes.includes(f.Hash));

    return newForms;
  },
  async test(context) {
    const { subdomain } = context.propsValue;

    const response = await wufooApiCall<{ Forms: any[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `https://${subdomain}.wufoo.com/api/v3/forms.json`,
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
