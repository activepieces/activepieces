import { createTrigger, Property, Polling } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const wufooNewFormEntry = createTrigger({
  name: 'new_form_entry',
  displayName: 'New Form Entry',
  description: 'Triggers when a new entry is submitted to a Wufoo form.',
  props: {
    formIdentifier: Property.ShortText({
      displayName: 'Form Identifier',
      description: 'The hash or title of the form to watch.',
      required: true,
    }),
  },
  type: Polling,
  async onEnable({ auth, propsValue, store }) {
    // No setup required
  },
  async onDisable({ auth, propsValue, store }) {
    // No teardown required
  },
  async run({ auth, propsValue, store, lastFetchEpochMS }) {
    const url = `https://${auth.subdomain}.wufoo.com/api/v3/forms/${propsValue.formIdentifier}/entries.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${auth.apiKey}:footastic`).toString('base64'),
      },
    });
    const entries = response.body.Entries || [];
    // Filter by created time if lastFetchEpochMS is provided
    let newEntries = entries;
    if (lastFetchEpochMS) {
      newEntries = entries.filter((entry: any) => {
        const created = new Date(entry.DateCreated).getTime();
        return created > lastFetchEpochMS;
      });
    }
    return newEntries.map((entry: any) => ({
      epochMilliSeconds: new Date(entry.DateCreated).getTime(),
      data: entry,
    }));
  },
}); 