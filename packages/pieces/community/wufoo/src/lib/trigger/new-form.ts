import { createTrigger, Property, Polling } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const wufooNewForm = createTrigger({
  name: 'new_form',
  displayName: 'New Form',
  description: 'Triggers when a new form is created in Wufoo.',
  props: {},
  type: Polling,
  async onEnable({ auth, store }) {
    // No setup required
  },
  async onDisable({ auth, store }) {
    // No teardown required
  },
  async run({ auth, store, lastFetchEpochMS }) {
    const url = `https://${auth.subdomain}.wufoo.com/api/v3/forms.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${auth.apiKey}:footastic`).toString('base64'),
      },
    });
    const forms = response.body.Forms || [];
    let newForms = forms;
    if (lastFetchEpochMS) {
      newForms = forms.filter((form: any) => {
        const created = new Date(form.DateCreated).getTime();
        return created > lastFetchEpochMS;
      });
    }
    return newForms.map((form: any) => ({
      epochMilliSeconds: new Date(form.DateCreated).getTime(),
      data: form,
    }));
  },
}); 