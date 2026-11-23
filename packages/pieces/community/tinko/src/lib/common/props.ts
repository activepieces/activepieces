import { InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import {
  TinkoChannel,
  TinkoCustomField,
  TinkoTag,
  TinkoTemplate,
  TinkoUser,
  tinkoClient,
} from './client';

const CONNECT_FIRST = 'Connect your Tinko account first';

function channelDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    auth: tinkoAuth,
    displayName: 'Channel',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: CONNECT_FIRST };
      }
      const channels = await tinkoClient.listAll<TinkoChannel>({
        token: auth.secret_text,
        path: '/channels',
      });
      return {
        disabled: false,
        options: channels.map((channel) => ({
          label: channelLabel(channel),
          value: channel.id,
        })),
      };
    },
  });
}

function channelsMultiSelect({ description }: { description: string }) {
  return Property.MultiSelectDropdown({
    auth: tinkoAuth,
    displayName: 'Channels',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: CONNECT_FIRST };
      }
      const channels = await tinkoClient.listAll<TinkoChannel>({
        token: auth.secret_text,
        path: '/channels',
      });
      return {
        disabled: false,
        options: channels.map((channel) => ({
          label: channelLabel(channel),
          value: channel.id,
        })),
      };
    },
  });
}

function attendantDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    auth: tinkoAuth,
    displayName: 'Attendant',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: CONNECT_FIRST };
      }
      const users = await tinkoClient.listAll<TinkoUser>({
        token: auth.secret_text,
        path: '/users',
        queryParams: { status: 'active' },
      });
      return {
        disabled: false,
        options: users.map((user) => ({
          label: user.email ? `${user.name} (${user.email})` : user.name,
          value: user.id,
        })),
      };
    },
  });
}

function tagsMultiSelect({
  description,
  required = false,
}: {
  description: string;
  required?: boolean;
}) {
  return Property.MultiSelectDropdown({
    auth: tinkoAuth,
    displayName: 'Tags',
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: CONNECT_FIRST };
      }
      const tags = await tinkoClient.listAll<TinkoTag>({
        token: auth.secret_text,
        path: '/tags',
      });
      return {
        disabled: false,
        options: tags
          .map((tag) => ({ label: tagLabel(tag), value: tag.id }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      };
    },
  });
}

function templateDropdown() {
  return Property.Dropdown({
    auth: tinkoAuth,
    displayName: 'Template',
    description:
      'The approved WhatsApp template to send. Templates work only on official WhatsApp (WhatsApp Business API) channels, and the list shows the approved templates of the selected channel.',
    required: true,
    refreshers: ['channel'],
    options: async ({ auth, channel }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: CONNECT_FIRST };
      }
      if (typeof channel !== 'string' || channel === '') {
        return { disabled: true, options: [], placeholder: 'Select a channel first' };
      }
      const templates = await tinkoClient.listAll<TinkoTemplate>({
        token: auth.secret_text,
        path: '/templates',
        queryParams: { channel, status: 'approved' },
      });
      if (templates.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'This channel has no approved templates',
        };
      }
      return {
        disabled: false,
        options: templates.map((template) => ({
          label: template.language ? `${template.name} (${template.language})` : template.name,
          value: template.id,
        })),
      };
    },
  });
}

function customFields({ description }: { description: string }) {
  return Property.DynamicProperties({
    auth: tinkoAuth,
    displayName: 'Custom Fields',
    description,
    required: false,
    refreshers: [],
    props: async ({ auth }): Promise<InputPropertyMap> => {
      if (!auth) {
        return {};
      }
      const fields = await tinkoClient.listAll<TinkoCustomField>({
        token: auth.secret_text,
        path: '/contacts/customfields',
        queryParams: { is_active: 'true' },
      });
      return Object.fromEntries(fields.map((field) => [field.id, customFieldProperty(field)]));
    },
  });
}

function customFieldProperty(field: TinkoCustomField) {
  const options = (field.options ?? []).filter((option) => option.trim() !== '');
  if (field.type === 'select' && options.length > 0) {
    return Property.StaticDropdown({
      displayName: field.name,
      description: 'Select one of the options configured for this field in Tinko.',
      required: false,
      options: {
        options: options.map((option) => ({ label: option, value: option })),
      },
    });
  }
  return Property.ShortText({
    displayName: field.name,
    description: CUSTOM_FIELD_HINTS[field.type] ?? field.placeholder ?? undefined,
    required: false,
  });
}

function channelLabel(channel: TinkoChannel): string {
  return channel.type ? `${channel.name} (${channel.type})` : channel.name;
}

function tagLabel(tag: TinkoTag): string {
  return [tag.emoji, tag.text]
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(' ');
}

const CUSTOM_FIELD_HINTS: Record<string, string> = {
  date: 'Date in the format YYYY-MM-DD, for example 2026-03-15.',
  number: 'A number, for example 42.',
  email: 'An email address, for example jane@example.com.',
};

export const tinkoProps = {
  channelDropdown,
  channelsMultiSelect,
  attendantDropdown,
  tagsMultiSelect,
  templateDropdown,
  customFields,
};
