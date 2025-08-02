import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoApiCall } from './client';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { RespondIoAuth } from './auth';

// --- Interfaces for Contact Dropdown ---
interface RespondIoContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface RespondIoContactListResponse {
    data: RespondIoContact[];
    paging?: { next?: string };
}

// --- Interfaces for Assignee (User) Dropdown ---
interface RespondIoUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface RespondIoUserListResponse {
    data: RespondIoUser[];
}


// --- Contact Dropdown ---
export const contactIdentifierDropdown = Property.Dropdown({
    displayName: 'Contact',
    description: 'Select the contact.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, options: [], placeholder: 'Connect your Respond.io account first' };
        }
        try {
            const response = await respondIoApiCall<RespondIoContactListResponse>({
                auth: auth as PiecePropValueSchema<typeof RespondIoAuth>,
                method: HttpMethod.GET,
                url: '/contact/list?limit=100',
            });
            const contacts = response.data;
            if (contacts.length === 0) {
                return { disabled: true, options: [], placeholder: 'No contacts found in your workspace.' };
            }
            return {
                disabled: false,
                options: contacts.map((contact) => {
                    const contactInfo = contact.email || contact.phone || `ID: ${contact.id}`;
                    return {
                        label: `${contact.firstName || ''} ${contact.lastName || ''} (${contactInfo})`.trim(),
                        value: `id:${contact.id}`,
                    };
                }),
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return { disabled: true, options: [], placeholder: `Error loading contacts: ${errorMessage}` };
        }
    },
});

// --- Assignee (User) Dropdown ---
export const assigneeDropdown = Property.Dropdown({
    displayName: 'Assignee',
    description: 'Select the user to assign the conversation to.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, options: [], placeholder: 'Connect your Respond.io account first' };
        }
        try {
            // This endpoint correctly lists all users in the workspace.
            const response = await respondIoApiCall<RespondIoUserListResponse>({
                auth: auth as PiecePropValueSchema<typeof RespondIoAuth>,
                method: HttpMethod.GET,
                url: '/space/user',
            });
            const users = response.data;
            if (users.length === 0) {
                return { disabled: true, options: [], placeholder: 'No users found in your workspace.' };
            }
            return {
                disabled: false,
                options: users.map((user) => ({
                    label: `${user.firstName} ${user.lastName} (${user.email})`.trim(),
                    // The 'assign' action requires the User ID
                    value: user.id,
                })),
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return { disabled: true, options: [], placeholder: `Error loading users: ${errorMessage}` };
        }
    },
});
