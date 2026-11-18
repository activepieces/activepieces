import {
  DropdownState,
  DynamicPropsValue,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusApi } from './api';

function listId<R extends boolean>({
  required,
  displayName = 'List',
  description = 'The mailing list to use.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: emailOctopusAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your account first' });
      }
      const lists = await emailOctopusApi.listLists({ auth });
      return {
        disabled: false,
        options: lists.map((list) => ({ label: list.name, value: list.id })),
      };
    },
  });
}

function campaignId<R extends boolean>({
  required,
  displayName = 'Campaign',
  description = 'Select a campaign to filter events. Leave blank to trigger for all campaigns.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: emailOctopusAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your account first' });
      }
      const campaigns = await emailOctopusApi.listCampaigns({ auth });
      return {
        disabled: false,
        options: campaigns.map((campaign) => ({
          label: campaign.name,
          value: campaign.id,
        })),
      };
    },
  });
}

function fields<R extends boolean>({
  required,
  displayName = 'Fields',
  description = "The contact's custom fields.",
}: PropParams<R>) {
  return Property.DynamicProperties({
    auth: emailOctopusAuth,
    displayName,
    description,
    required,
    refreshers: ['list_id'],
    props: async ({ auth, list_id }): Promise<InputPropertyMap> => {
      if (!auth || typeof list_id !== 'string' || !list_id) {
        return {};
      }

      const listDetails = await emailOctopusApi.getList({
        auth,
        listId: list_id,
      });

      const fieldProps: DynamicPropsValue = {};
      for (const field of listDetails.fields) {
        if (field.tag === 'EmailAddress') continue;
        const choices = (field.choices ?? []).map((opt) => ({
          label: opt,
          value: opt,
        }));
        switch (field.type) {
          case 'number':
            fieldProps[field.tag] = Property.Number({
              displayName: field.label,
              required: false,
            });
            break;
          case 'date':
            fieldProps[field.tag] = Property.ShortText({
              displayName: field.label,
              description: 'Date in YYYY-MM-DD format.',
              required: false,
            });
            break;
          case 'text':
            fieldProps[field.tag] = Property.ShortText({
              displayName: field.label,
              required: false,
            });
            break;
          case 'choice_single':
            fieldProps[field.tag] = Property.StaticDropdown({
              displayName: field.label,
              required: false,
              options: { disabled: false, options: choices },
            });
            break;
          case 'choice_multiple':
            fieldProps[field.tag] = Property.StaticMultiSelectDropdown({
              displayName: field.label,
              required: false,
              options: { disabled: false, options: choices },
            });
            break;
          default:
            break;
        }
      }
      return fieldProps;
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const emailOctopusProps = { listId, campaignId, fields };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
