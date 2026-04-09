import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { instantlyAuth } from '../auth';
import { instantlyClient } from './client';
import { InstantlyCampaign, InstantlyLead, InstantlyLeadList } from './types';

function hasProperty<K extends PropertyKey>(
  obj: object,
  key: K,
): obj is Record<K, unknown> {
  return key in obj;
}

function getAuthToken(auth: unknown): string | null {
  if (typeof auth !== 'object' || auth === null || !hasProperty(auth, 'secret_text')) {
    return null;
  }
  const { secret_text } = auth;
  return typeof secret_text === 'string' ? secret_text : null;
}

function campaignId(required = true) {
  return Property.Dropdown({
    auth: instantlyAuth,
    displayName: 'Campaign',
    refreshers: [],
    required,
    options: async ({ auth }) => {
      const token = getAuthToken(auth);
      if (!token) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const { data: campaigns, error } = await tryCatch(() =>
        instantlyClient.listAllPages<InstantlyCampaign>({
          auth: token,
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
      const token = getAuthToken(auth);
      if (!token) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const { data: lists, error } = await tryCatch(() =>
        instantlyClient.listAllPages<InstantlyLeadList>({
          auth: token,
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
      const token = getAuthToken(auth);
      if (!token) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const { data: leads, error } = await tryCatch(() =>
        instantlyClient.listAllPages<InstantlyLead>({
          auth: token,
          path: 'leads/list',
          method: HttpMethod.POST,
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

function webhookEventType(required = true) {
  return Property.StaticDropdown({
    displayName: 'Event Type',
    description: 'The type of event that triggers the webhook.',
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Lead Interested', value: 'lead_interested' },
        { label: 'Lead Not Interested', value: 'lead_not_interested' },
        { label: 'Lead Neutral', value: 'lead_neutral' },
      ],
    },
  });
}

export const instantlyProps = {
  campaignId,
  listId,
  leadId,
  webhookEventType,
};
