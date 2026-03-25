import { Property, DropdownState } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../auth';
import { whatsscaleClient } from './client';

/**
 * Reusable dropdown props shared across actions.
 *
 * Sprint 1: session only.
 * Sprint 2: contact, group, channel, crmContact, crmTag added.
 */
export const whatsscaleProps = {
  session: Property.Dropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'WhatsApp Session',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          '/make/sessions'
        );
        const sessions = response.body as { label: string; value: string }[];
        if (!sessions || sessions.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'No sessions found. Connect WhatsApp at whatsscale.com',
          };
        }
        return {
          disabled: false,
          options: sessions,
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading sessions',
        };
      }
    },
  }),

  contact: Property.Dropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'Contact',
    required: true,
    refreshers: ['session'],
    options: async ({ auth, session }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      if (!session) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a session first',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          '/make/contacts',
          undefined,
          { session: session as string }
        );
        const contacts = response.body as { label: string; value: string }[];
        if (!contacts || contacts.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No contacts found',
          };
        }
        return { disabled: false, options: contacts };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading contacts',
        };
      }
    },
  }),

  group: Property.Dropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'Group',
    required: true,
    refreshers: ['session'],
    options: async ({ auth, session }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      if (!session) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a session first',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          '/make/groups',
          undefined,
          { session: session as string }
        );
        const groups = response.body as { label: string; value: string }[];
        if (!groups || groups.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No groups found',
          };
        }
        return { disabled: false, options: groups };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading groups',
        };
      }
    },
  }),

  channel: Property.Dropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'Channel',
    required: true,
    refreshers: ['session'],
    options: async ({ auth, session }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      if (!session) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a session first',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          '/make/channels',
          undefined,
          { session: session as string }
        );
        const channels = response.body as { label: string; value: string }[];
        if (!channels || channels.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No channels found',
          };
        }
        return { disabled: false, options: channels };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading channels',
        };
      }
    },
  }),

  crmContact: Property.Dropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'CRM Contact',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          '/make/crm/contacts'
        );
        const contacts = response.body;
        if (!contacts || contacts.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No CRM contacts found',
          };
        }
        return {
          disabled: false,
          options: contacts.map((contact: any) => ({
            label: contact.name,
            value: contact.id,
          })),
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading CRM contacts',
        };
      }
    },
  }),

  crmTag: Property.Dropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'Tag',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          '/make/crm/tags'
        );
        const tags = response.body as { label: string; value: string }[];
        if (!tags || tags.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No tags found',
          };
        }
        return { disabled: false, options: tags };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading tags',
        };
      }
    },
  }),
};
