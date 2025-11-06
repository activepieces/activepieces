import {
  Property,
  DynamicPropsValue,
  DropdownState,
  InputPropertyMap,
  PropertyContext,
} from '@activepieces/pieces-framework';
import { EmailOctopusClient } from './client';

type AuthAndProps = {
  auth: string | undefined;
  propsValue: Record<string, unknown>;
};

export const emailOctopusProps = {
  listId: (required = true) =>
    Property.Dropdown({
      displayName: 'List',
      description: 'The mailing list to use.',
      required: required,
      refreshers: [],
      options: async (context) => {
        const { auth } = context as AuthAndProps;
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = new EmailOctopusClient(auth);
        const lists = await client.getLists();
        return {
          disabled: false,
          options: lists.map((list) => ({
            label: list.name,
            value: list.id,
          })),
        };
      },
    }),

  campaignId: (required = false) =>
    Property.Dropdown({
      displayName: 'Campaign',
      description:
        'Select a campaign to filter events. Leave blank to trigger for all campaigns.',
      required: required,
      refreshers: [],
      options: async (context) => {
        const { auth } = context as AuthAndProps;
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = new EmailOctopusClient(auth);
        const campaigns = await client.getCampaigns();
        return {
          disabled: false,
          options: campaigns.map((campaign) => ({
            label: campaign.name,
            value: campaign.id,
          })),
        };
      },
    }),

  fields: () =>
    Property.DynamicProperties({
      displayName: 'Fields',
      description: "The contact's custom fields.",
      required: true,
      refreshers: ['list_id'],
      props: async ({ auth, list_id }): Promise<InputPropertyMap> => {
        if (!auth || !list_id) {
          return {};
        }

        const client = new EmailOctopusClient(auth as unknown as string);
        const listDetails = await client.getList(list_id as unknown as string);

        const fields: DynamicPropsValue = {};
        for (const field of listDetails.fields) {
          if (field.tag === 'EmailAddress') continue;
          switch (field.type) {
            case 'number':
              fields[field.tag] = Property.Number({
                displayName: field.label,
                required: false,
              });
              break;
            case 'date':
              fields[field.tag] = Property.ShortText({
                displayName: field.label,
                description: 'Date in YYYY-MM-DD format.',
                required: false,
              });
              break;
            case 'text':
              fields[field.tag] = Property.ShortText({
                displayName: field.label,
                required: false,
              });
              break;
            case 'choice_single':
              fields[field.tag] = Property.StaticDropdown({
                displayName: field.label,
                required: false,
                options: {
                  disabled: false,
                  options: field.choices
                    ? field.choices.map((opt) => ({ label: opt, value: opt }))
                    : [],
                },
              });
              break;
            case 'choice_multiple':
              fields[field.tag] = Property.StaticMultiSelectDropdown({
                displayName: field.label,
                required: false,
                options: {
                  disabled: false,
                  options: field.choices
                    ? field.choices.map((opt) => ({ label: opt, value: opt }))
                    : [],
                },
              });
              break;
            default:
              break;
          }
        }
        return fields;
      },
    }),
};
