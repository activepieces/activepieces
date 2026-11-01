import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient } from '../common';

export const createEmailMarketingCampaignAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_email_marketing_campaign',
  classification: 'WRITE',
  displayName: 'Create Email Marketing Campaign',
  description: 'Creates an email campaign for one or more lists.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new VBOUT email marketing campaign targeting one or more email lists, either standard or automated type. Use to set up an email send to existing recipients. Requires recipient list(s), name, subject, sender details, and message body; not idempotent, as each call creates a separate campaign.',
    idempotent: false,
  },
  props: {
    lists: Property.MultiSelectDropdown({
      auth: vboutAuth,
      displayName: 'Email Lists',
      description: 'Everyone on these lists receives the campaign.',
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
        const client = makeClient(auth.secret_text);
        const res = await client.listEmailLists();
        if (res.lists.items.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No email lists found. Create one in VBOUT first.',
          };
        }
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
      displayName: 'Name',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      display: 'cards',
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
      placeholder: 'news@acme.com',
      width: 'half',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      placeholder: 'Jane from Acme',
      width: 'half',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      placeholder: 'support@example.com',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
  },
  propertyGroups: [
    { key: 'recipients', display: 'section', label: 'Recipients', icon: 'users', props: ['lists'] },
    { key: 'campaign', display: 'section', label: 'Campaign', icon: 'tag', props: ['name', 'type'] },
    { key: 'sender', display: 'section', label: 'Sender', icon: 'send', props: ['from_name', 'fromemail', 'reply_to'] },
    { key: 'email', display: 'section', label: 'Email', icon: 'text', props: ['subject', 'body'] },
  ],
  async run(context) {
    const { lists, name, from_name, fromemail, reply_to, subject, body, type } =
      context.propsValue;
    const client = makeClient(context.auth.secret_text);
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
