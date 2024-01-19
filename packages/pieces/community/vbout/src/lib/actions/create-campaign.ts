import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient } from '../common';

export const createEmailMarketingCampaignAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_email_marketing_campaign',
  displayName: 'Create Email Marketing Campaign',
  description: 'Creates a new email campaign for specific list.',
  props: {
    lists: Property.MultiSelectDropdown({
      displayName: 'Campaign Recipients List',
      required: true,
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
    name: Property.ShortText({
      displayName: 'Campaign Name',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Campaign Subject',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Campaign Type',
      required: true,
      defaultValue: 'standard',
      options: {
        disabled: false,
        options: [
          {
            label: 'Standard',
            value: 'standard',
          },
          {
            label: 'Automated',
            value: 'automated',
          },
        ],
      },
    }),
    fromemail: Property.ShortText({
      displayName: 'From Email',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      required: true,
    }),
  },
  async run(context) {
    const { lists, name, from_name, fromemail, reply_to, subject, body, type } =
      context.propsValue;
    const client = makeClient(context.auth as string);
    return await client.addCampaign({
      lists: lists.join(','),
      name,
      from_name,
      fromemail,
      reply_to,
      subject,
      body,
      type,
    });
  },
});
