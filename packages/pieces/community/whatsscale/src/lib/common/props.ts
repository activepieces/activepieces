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
        return {
          disabled: false,
          options: contacts.map((contact) => ({
            label: toContactLabel(contact),
            value: contact.value,
          })),
        };
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
        const contacts = response.body as { label: string; value: string }[];
        if (!contacts || contacts.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No CRM contacts found',
          };
        }
        return { disabled: false, options: contacts };
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

  groupParticipants: Property.MultiSelectDropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'Participants',
    description: 'Pick one or more current members of the selected group.',
    required: true,
    refreshers: ['session', 'group'],
    options: async ({ auth, session, group }): Promise<DropdownState<string>> => {
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
      if (!group) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a group first',
        };
      }
      try {
        const response = await whatsscaleClient(
          auth.secret_text,
          HttpMethod.GET,
          `/v1/groups/${group as string}/participants`,
          undefined,
          { session: session as string, limit: '500' }
        );
        const participants = response.body as GroupParticipantOption[];
        if (!participants || participants.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No participants found',
          };
        }
        return {
          disabled: false,
          options: participants.map((participant) => ({
            label: toParticipantLabel(participant),
            value: toParticipantValue(participant),
          })),
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading participants',
        };
      }
    },
  }),

  contactsToAdd: Property.MultiSelectDropdown<string, true, typeof whatsscaleAuth>({
    auth: whatsscaleAuth,
    displayName: 'Participants',
    description: 'Pick one or more contacts from this session to add to the group.',
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
        const contacts = (response.body as { label: string; value: string }[]).filter(
          (contact) => contact.value.endsWith('@c.us'),
        );
        if (contacts.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No phone-number contacts found',
          };
        }
        return {
          disabled: false,
          options: contacts.map((contact) => ({
            label: toContactLabel(contact),
            value: contact.value,
          })),
        };
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
};

function toContactLabel(contact: { label: string; value: string }): string {
  const [id, domain] = contact.value.split('@');
  const name = contact.label?.trim();
  const hasName = Boolean(name) && name !== id;
  if (domain === 'lid') {
    return hasName ? `${name} (hidden number)` : `Hidden number (${id})`;
  }
  const phone = `+${id}`;
  return hasName ? `${name} (${phone})` : phone;
}

function toParticipantLabel(participant: GroupParticipantOption): string {
  const phone = toParticipantPhone(participant);
  const name = phone ?? `Hidden number (${participant.id.split('@')[0]})`;
  return participant.role && participant.role !== 'participant'
    ? `${name} (${participant.role})`
    : name;
}

function toParticipantValue(participant: GroupParticipantOption): string {
  const pn = participant.pn?.trim();
  return pn ? pn : participant.id;
}

function toParticipantPhone(participant: GroupParticipantOption): string | undefined {
  const pn = participant.pn?.trim();
  return pn ? pn.split('@')[0] : undefined;
}

type GroupParticipantOption = {
  id: string;
  pn?: string | null;
  role?: string | null;
};
