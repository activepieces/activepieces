import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveCommon } from './client';


export const contactBookDropdown = Property.Dropdown({
    displayName: 'Contact Book',
    description: 'Select the contact book where the contact will be created',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: '/contact_books',
            });

            const contactBooks = response.body?.contact_books || [];
            const options = contactBooks.map((book: any) => ({
                label: book.name,
                value: book.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load contact books',
                options: [],
            };
        }
    },
});


export const organizationDropdown = Property.Dropdown({
    displayName: 'Organization',
    description: 'Select an organization',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: '/organizations',
            });

            const organizations = response.body?.organizations || [];
            const options = organizations.map((org: any) => ({
                label: org.name,
                value: org.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load organizations',
                options: [],
            };
        }
    },
});


export const groupDropdown = Property.Dropdown({
    displayName: 'Group',
    description: 'Select a group',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: '/groups',
            });

            const groups = response.body?.groups || [];
            const options = groups.map((group: any) => ({
                label: group.name,
                value: group.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load groups',
                options: [],
            };
        }
    },
});


export const contactGroupDropdown = Property.Dropdown({
    displayName: 'Contact Group',
    description: 'Select a contact group or organization',
    required: false,
    refreshers: ['contact_book', 'group_kind'],
    options: async ({ auth, contact_book, group_kind }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        if (!contact_book) {
            return {
                disabled: true,
                placeholder: 'Please select a contact book first',
                options: [],
            };
        }

        if (!group_kind) {
            return {
                disabled: true,
                placeholder: 'Please select a group type first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: `/contact_groups?contact_book=${contact_book}&kind=${group_kind}`,
            });

            const contactGroups = response.body?.contact_groups || [];
            const options = contactGroups.map((group: any) => ({
                label: group.name,
                value: group.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load contact groups',
                options: [],
            };
        }
    },
});


export const optionalContactBookDropdown = Property.Dropdown({
    displayName: 'Contact Book',
    description: 'Contact book to search within (optional)',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: '/contact_books',
            });

            const contactBooks = response.body?.contact_books || [];
            const options = contactBooks.map((book: any) => ({
                label: book.name,
                value: book.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load contact books',
                options: [],
            };
        }
    },
});

export const contactDropdown = Property.Dropdown({
    displayName: 'Contact',
    description: 'Select a contact',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: '/contacts?limit=200',
            });

            const contacts = response.body?.contacts || [];
            const options = contacts.map((contact: any) => {
                const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed Contact';
                const email = contact.infos?.find((info: any) => info.kind === 'email')?.value;
                const label = email ? `${name} (${email})` : name;
                return {
                    label: label,
                    value: contact.id,
                };
            });

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load contacts',
                options: [],
            };
        }
    },
});


export const teamDropdown = Property.Dropdown({
    displayName: 'Team',
    description: 'Select a team',
    required: false,
    refreshers: ['organization'],
    options: async ({ auth, organization }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        if (!organization) {
            return {
                disabled: true,
                placeholder: 'Please select an organization first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: `/teams?organization=${organization}`,
            });

            const teams = response.body?.teams || [];
            const options = teams.map((team: any) => ({
                label: team.name,
                value: team.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load teams',
                options: [],
            };
        }
    },
});


export const sharedLabelDropdown = Property.Dropdown({
    displayName: 'Shared Label',
    description: 'Select a shared label',
    required: false,
    refreshers: ['organization'],
    options: async ({ auth, organization }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        if (!organization) {
            return {
                disabled: true,
                placeholder: 'Please select an organization first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: `/shared_labels?organization=${organization}`,
            });

            const sharedLabels = response.body?.shared_labels || [];
            const options = sharedLabels.map((label: any) => ({
                label: label.name,
                value: label.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load shared labels',
                options: [],
            };
        }
    },
});


export const userDropdown = Property.Dropdown({
    displayName: 'User',
    description: 'Select a user',
    required: false,
    refreshers: ['organization'],
    options: async ({ auth, organization }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        if (!organization) {
            return {
                disabled: true,
                placeholder: 'Please select an organization first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: `/users?organization=${organization}`,
            });

            const users = response.body?.users || [];
            const options = users.map((user: any) => ({
                label: `${user.name} (${user.email})`,
                value: user.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load users',
                options: [],
            };
        }
    },
});

export const membershipOrganizationDropdown = Property.Dropdown({
    displayName: 'Organization',
    description: 'Select an organization for membership',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: '/organizations',
            });

            const organizations = response.body?.organizations || [];
            const options = organizations.map((org: any) => ({
                label: org.name,
                value: org.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load organizations',
                options: [],
            };
        }
    },
});

export const membershipContactGroupDropdown = Property.Dropdown({
    displayName: 'Contact Group',
    description: 'Select a contact group',
    required: false,
    refreshers: ['contact_book', 'group_kind'],
    options: async ({ auth, contact_book, group_kind }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first',
                options: [],
            };
        }

        if (!contact_book) {
            return {
                disabled: true,
                placeholder: 'Please select a contact book first',
                options: [],
            };
        }

        if (!group_kind) {
            return {
                disabled: true,
                placeholder: 'Please select a group type first',
                options: [],
            };
        }

        try {
            const response = await missiveCommon.apiCall({
                auth: auth as string,
                method: HttpMethod.GET,
                resourceUri: `/contact_groups?contact_book=${contact_book}&kind=${group_kind}`,
            });

            const contactGroups = response.body?.contact_groups || [];
            const options = contactGroups.map((group: any) => ({
                label: group.name,
                value: group.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: 'Failed to load contact groups',
                options: [],
            };
        }
    },
}); 