import { Property, DropdownState } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

interface FrontLink {
  id: string;
  name: string;
  external_url: string;
}
interface FrontConversation {
  id: string;
  subject: string;
  last_message: { blurb: string };
}
interface FrontAccount {
  id: string;
  name: string;
}
interface FrontChannel {
  id: string;
  name: string;
  address: string;
}
interface FrontTeammate {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}
interface FrontTag {
  id: string;
  name: string;
}
interface FrontContact {
  id: string;
  name: string;
}

interface FrontContactHandle {
  source: string;
  handle: string;
}

interface FrontContact {
  id: string;
  name: string;
  handles: FrontContactHandle[]; 
}

export const frontProps = {
  account: (props?: { required?: boolean }) =>
    Property.Dropdown({
      displayName: 'Account',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth, searchValue }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontAccount[] }>(
          auth as string,
          HttpMethod.GET,
          `/accounts?q=${searchValue}`
        );
        return {
          disabled: false,
          options: response._results.map((account) => ({
            label: account.name,
            value: account.id,
          })),
        };
      },
    }),

  channel: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.Dropdown({
      displayName: props?.displayName ?? 'Channel',
      description:
        props?.description ??
        'Select the channel (inbox) to send the message from.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontChannel[] }>(
          auth as string,
          HttpMethod.GET,
          '/channels'
        );
        return {
          disabled: false,
          options: response._results.map((channel) => ({
            label: `${channel.name} (${channel.address})`,
            value: channel.id,
          })),
        };
      },
    }),

  teammate: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.Dropdown({
      displayName: props?.displayName ?? 'Author',
      description:
        props?.description ??
        'The teammate on behalf of whom the message is sent.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontTeammate[] }>(
          auth as string,
          HttpMethod.GET,
          '/teammates'
        );
        return {
          disabled: false,
          options: response._results.map((teammate) => ({
            label: `${teammate.first_name} ${teammate.last_name} (${teammate.username})`,
            value: teammate.id,
          })),
        };
      },
    }),

  tags: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.MultiSelectDropdown({
      displayName: props?.displayName ?? 'Tags',
      description: props?.description ?? 'Select the tags to apply.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontTag[] }>(
          auth as string,
          HttpMethod.GET,
          '/tags'
        );
        return {
          disabled: false,
          options: response._results.map((tag) => ({
            label: tag.name,
            value: tag.id,
          })),
        };
      },
    }),

  tag: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.Dropdown({
      displayName: props?.displayName ?? 'Tag',
      description: props?.description ?? 'Select the tag to filter by.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontTag[] }>(
          auth as string,
          HttpMethod.GET,
          '/tags'
        );
        return {
          disabled: false,
          options: response._results.map((tag) => ({
            label: tag.name,
            value: tag.id,
          })),
        };
      },
    }),

  conversation: (props?: { required?: boolean }) =>
    Property.Dropdown({
      displayName: 'Conversation',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({
        auth,
        searchValue,
      }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }

        const query =
          typeof searchValue === 'string' && searchValue.trim() !== ''
            ? `?q[any]=${encodeURIComponent(searchValue)}`
            : '';

        const response = await makeRequest<{ _results: FrontConversation[] }>( // Use the correct makeRequest function
          auth as string,
          HttpMethod.GET,
          `/conversations${query}`
        );

        return {
          disabled: false,
          options: response._results.map((convo: FrontConversation) => ({
            label:
              convo.subject ||
              convo.last_message?.blurb ||
              'Unnamed Conversation',
            value: convo.id,
          })),
        };
      },
    }),

  link: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.Dropdown({
      displayName: props?.displayName ?? 'Link',
      description: props?.description ?? 'Select the link to update.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontLink[] }>(
          auth as string,
          HttpMethod.GET,
          '/links'
        );
        return {
          disabled: false,
          options: response._results.map((link) => ({
            label: `${link.name || 'Untitled Link'} (${link.external_url})`,
            value: link.id,
          })),
        };
      },
    }),

  links: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.MultiSelectDropdown({
      displayName: props?.displayName ?? 'Links',
      description: props?.description ?? 'Select the links to add.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontLink[] }>(
          auth as string,
          HttpMethod.GET,
          '/links'
        );
        return {
          disabled: false,
          options: response._results.map((link) => ({
            label: `${link.name || 'Untitled Link'} (${link.external_url})`,
            value: link.id,
          })),
        };
      },
    }),
  inbox: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.Dropdown({
      displayName: props?.displayName ?? 'Inbox',
      description:
        props?.description ?? 'Select the inbox to move the conversation to.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{
          _results: { id: string; name: string }[];
        }>(auth as string, HttpMethod.GET, '/inboxes');
        return {
          disabled: false,
          options: response._results.map((inbox) => ({
            label: inbox.name,
            value: inbox.id,
          })),
        };
      },
    }),
  contact: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.Dropdown({
      displayName: props?.displayName ?? 'Contact',
      description: props?.description ?? 'Select a contact.',
      required: props?.required ?? true,
      refreshers: [],
      options: async ({ auth, searchValue }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first.',
          };
        }
        const response = await makeRequest<{ _results: FrontContact[] }>(
          auth as string,
          HttpMethod.GET,
          `/contacts?q=${searchValue}`
        );
        return {
          disabled: false,
          options: response._results.map((contact) => ({
            label: contact.name || 'Unnamed Contact',
            value: contact.id,
          })),
        };
      },
    }),
  contact_handles: (props?: {
    displayName?: string;
    description?: string;
    required?: boolean;
  }) =>
    Property.Dropdown({
      displayName: props?.displayName ?? 'Handle',
      description: props?.description ?? 'Select the handle to remove.',
      required: props?.required ?? true,
      refreshers: ['contact_id'],
      options: async ({ auth, contact_id }): Promise<DropdownState<string>> => {
        if (!auth || !contact_id) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Please connect your account and select a contact first.',
          };
        }
        const response = await makeRequest<FrontContact>(
          auth as string,
          HttpMethod.GET,
          `/contacts/${contact_id}`
        );
        return {
          disabled: false,
          options: response.handles.map((handle) => ({
            label: `${handle.handle} (${handle.source})`,
            value: handle.handle,
          })),
        };
      },
    }),
};
