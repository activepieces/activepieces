import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownOption, Property, tryCatch } from '@activepieces/pieces-framework';
import { instantlyAuth } from '../auth';
import { instantlyClient } from './client';
import { InstantlyCampaign, InstantlyLead, InstantlyLeadList } from './types';

function campaignId(required = true) {
  return Property.Dropdown({
    auth: instantlyAuth,
    displayName: 'Campaign',
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const { data: campaigns, error } = await tryCatch(() =>
        instantlyClient.listAllPages<InstantlyCampaign>({
          auth: auth.secret_text,
          path: 'campaigns',
        }),
      );

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load campaigns. Check your connection.',
        };
      }

      return {
        disabled: false,
        options: campaigns.map((c) => ({ label: c.name, value: c.id })),
      };
    },
  });
}

function listId(required = true) {
  return Property.Dropdown({
    auth: instantlyAuth,
    displayName: 'List',
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const { data: lists, error } = await tryCatch(() =>
        instantlyClient.listAllPages<InstantlyLeadList>({
          auth: auth.secret_text,
          path: 'lead-lists',
        }),
      );

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load lists. Check your connection.',
        };
      }

      return {
        disabled: false,
        options: lists.map((l) => ({ label: l.name, value: l.id })),
      };
    },
  });
}

function leadId(required = true) {
  return Property.Dropdown({
    auth: instantlyAuth,
    displayName: 'Lead',
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const { data: leads, error } = await tryCatch(() =>
        instantlyClient.listAllPages<InstantlyLead>({
          auth: auth.secret_text,
          path: 'leads/list',
          method: HttpMethod.POST,
          maxPages: 5,
        }),
      );

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load leads. Check your connection.',
        };
      }

      const options: DropdownOption<string>[] = leads.map((lead) => {
        const name = [lead.first_name, lead.last_name]
          .filter(Boolean)
          .join(' ');
        return {
          label: name || lead.email,
          value: lead.id,
        };
      });

      return {
        disabled: false,
        options,
      };
    },
  });
}

export const instantlyProps = {
  campaignId,
  listId,
  leadId,
};
