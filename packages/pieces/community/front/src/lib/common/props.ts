import { Property, DropdownProperty, BasicAuthProperty, OAuth2Property, SecretTextProperty } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';


interface FrontInbox {
  id: string;
  name: string;
}

interface FrontAccount {
    id: string;
    name: string;
}

interface FrontLink {
    id: string;
    name: string;
    external_url: string;
}

interface FrontContactHandle {
  handle: string;
  source: string;
}

interface FrontChannel {
    id: string;
    name: string;
    address: string;
}

interface FrontContact {
  id: string;
  name: string;

  handles: FrontContactHandle[];
}

interface FrontConversation {
    id: string;
    subject: string;
}

interface FrontTag {
    id: string;
    name: string;
}

interface FrontTeammate {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
}

export const inboxDropdown = Property.Dropdown({
    displayName: 'Inbox',
    description: 'Select the inbox to watch for new comments.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account first',
                options: [],
            };
        }
        const response = await makeRequest<{ _results: FrontInbox[] }>(
            auth as string,
            HttpMethod.GET,
            '/inboxes'
        );
        return {
            disabled: false,
            options: response._results.map((inbox) => ({
                label: inbox.name,
                value: inbox.id,
            })),
        };
    },
});

export const contactDropdown = Property.Dropdown({
    displayName: 'Contact',
    description: 'Select the contact to update.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ _results: FrontContact[] }>(
            auth as string,
            HttpMethod.GET,
            '/contacts'
        );
        return {
            disabled: false,
            options: response._results.map((contact) => {
                const handle = contact.handles.length > 0 ? `(${contact.handles[0].handle})` : '';
                return {
                    label: `${contact.name || 'Unnamed Contact'} ${handle}`,
                    value: contact.id,
                };
            }),
        };
    },
});

export const contactHandleDropdown = Property.Dropdown({
    displayName: 'Handle to Remove',
    description: 'Select the handle to remove from the contact.',
    required: true,
    refreshers: ['contact_id'],
    options: async ({ auth, contact_id }) => {
        if (!auth || !contact_id) {
            return {
                disabled: true,
                placeholder: 'Please select a contact first',
                options: [],
            };
        }

        const response = await makeRequest<FrontContact>(
            auth as string,
            HttpMethod.GET,
            `/contacts/${contact_id}`
        );
        
        // This part will now work correctly
        const options = response.handles.map((handle) => ({
            label: `${handle.handle} (${handle.source})`,
            value: JSON.stringify({ handle: handle.handle, source: handle.source }),
        }));

        return {
            disabled: false,
            options: options,
        };
    }
});

export const conversationDropdown = Property.Dropdown({
    displayName: 'Conversation',
    description: 'Select the conversation to tag.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ _results: FrontConversation[] }>(
            auth as string,
            HttpMethod.GET,
            '/conversations'
        );
        return {
            disabled: false,
            options: response._results.map((convo) => ({
                label: convo.subject || `Conversation ${convo.id}`,
                value: convo.id,
            })),
        };
    },
});

export const tagsMultiSelectDropdown = (props?: { displayName?: string, description?: string, required?: boolean }) => Property.MultiSelectDropdown({
    displayName: props?.displayName ?? 'Tags',
    description: props?.description ?? 'Select the tags.',
    required: props?.required ?? true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
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
    }
});

export const accountDropdown = Property.Dropdown({
    displayName: 'Account',
    description: 'Select the account to update.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ _results: FrontAccount[] }>(
            auth as string,
            HttpMethod.GET,
            '/accounts'
        );
        return {
            disabled: false,
            options: response._results.map((account) => ({
                label: account.name || `Account ${account.id}`,
                value: account.id,
            })),
        };
    },
});


export const teammateDropdown = (props?: { displayName?: string, description?: string, required?: boolean }): DropdownProperty<string, boolean> => Property.Dropdown({
    displayName: props?.displayName ?? 'Teammate',
    description: props?.description ?? 'Select the teammate.',
    required: props?.required ?? true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ _results: FrontTeammate[] }>(
            auth as string,
            HttpMethod.GET,
            '/teammates'
        );
        return {
            disabled: false,
            options: response._results.map((teammate) => ({
                label: `${teammate.first_name} ${teammate.last_name} (${teammate.email})`,
                value: teammate.id,
            })),
        };
    },
});

export const channelDropdown = Property.Dropdown({
    displayName: 'Channel',
    description: 'Select the channel to send the message from.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
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
});

export const linkDropdown = Property.Dropdown({
    displayName: 'Link',
    description: 'Select the link to update.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ _results: FrontLink[] }>(
            auth as string,
            HttpMethod.GET,
            '/links'
        );
        return {
            disabled: false,
            options: response._results.map((link) => ({
                label: link.name || link.external_url,
                value: link.id,
            })),
        };
    },
});

export const linksMultiSelectDropdown = (props?: { displayName?: string, description?: string, required?: boolean }) => Property.MultiSelectDropdown({
    displayName: props?.displayName ?? 'Links',
    description: props?.description ?? 'Select the links.',
    required: props?.required ?? true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ _results: FrontLink[] }>(
            auth as string,
            HttpMethod.GET,
            '/links'
        );
        return {
            disabled: false,
            options: response._results.map((link) => ({
                label: link.name || link.external_url,
                value: link.id,
            })),
        };
    },
});
