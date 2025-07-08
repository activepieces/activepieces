import { createTrigger, TriggerStrategy, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const newForm = createTrigger({
  name: 'new_form',
  displayName: 'New Form',
  description: 'Triggers when a new form is created in Wufoo.',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: 'Your Wufoo API Key',
  }),
  props: {
    subdomain: {
      type: 'short-text',
      displayName: 'Wufoo Subdomain',
      required: true,
      description: 'Your Wufoo account subdomain (e.g., fishbowl for https://fishbowl.wufoo.com)',
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    // No-op
  },
  async onDisable(context) {
    // No-op
  },
  async run(context) {
    const { subdomain } = context.propsValue;
    const apiKey = context.auth;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':footastic').toString('base64'),
      },
    });
    const forms = response.body?.Forms || [];
    return forms.map((form: any) => ({
      id: form.Hash,
      data: form,
    }));
  },
}); 