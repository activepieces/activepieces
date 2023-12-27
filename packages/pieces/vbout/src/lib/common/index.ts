import { VboutClient } from './client';
import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';

export function makeClient(apiKey: string): VboutClient {
  return new VboutClient(apiKey);
}

export const vboutCommon = {
  baseUrl: 'https://api.vbout.com/1',
  listid: (required = true) =>
    Property.Dropdown({
      displayName: 'List ID',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listEmailLists();
        return {
          disabled: false,
          options: res.lists.items.map((list) => {
            return {
              label: list.name,
              value: list.id,
            };
          }),
        };
      },
    }),
  listFields: Property.DynamicProperties({
    displayName: 'Fields',
    required: true,
    refreshers: ['listid'],
    props: async ({ auth, listid }) => {
      if (!auth || !listid) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account and select Email List.',
        };
      }
      const fields: DynamicPropsValue = {};
      const client = makeClient(auth as unknown as string);
      const contactList = await client.getEmailList(
        listid as unknown as string
      );
      const contactListFields = contactList.response.data.list.fields;
      for (const key in contactListFields) {
        if (contactListFields.hasOwnProperty(key)) {
          fields[key] = Property.ShortText({
            displayName: contactListFields[key],
            required: false,
          });
        }
      }
      return fields;
    },
  }),
};
