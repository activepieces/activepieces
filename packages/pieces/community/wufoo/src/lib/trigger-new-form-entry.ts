import { createTrigger, TriggerStrategy, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const newFormEntry = createTrigger({
  name: 'new_form_entry',
  displayName: 'New Form Entry',
  description: 'Triggers when a new entry is submitted to a Wufoo form.',
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
    formHash: {
      type: 'short-text',
      displayName: 'Form Hash',
      required: true,
      description: 'The hash of the form to watch for new entries.',
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
    const { subdomain, formHash } = context.propsValue;
    const apiKey = context.auth;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':footastic').toString('base64'),
      },
    });
    const entries = response.body?.Entries || [];
    return entries.map((entry: any) => ({
      id: entry.EntryId,
      data: entry,
    }));
  },
}); 