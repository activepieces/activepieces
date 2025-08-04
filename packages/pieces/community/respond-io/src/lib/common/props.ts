import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoApiCall } from './client';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { respondIoAuth } from './auth';

// --- Interfaces for Contact Dropdown ---
interface RespondIoContact {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  tags: string[];
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  lifecycle: string | null;
  created_at: number;
  language: string | null;
  profilePic: string | null;
  countryCode: string | null;
  custom_fields: Array<{ name: string; value: string }> | null;
}

interface RespondIoContactListResponse {
  items: RespondIoContact[];
  pagination?: {
    next?: string;
    previous?: string;
  };
}

// --- Interfaces for Assignee (User) Dropdown ---
interface RespondIoUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  team?: {
    id: number;
    name: string;
  } | null;
  restrictions: string[];
}

interface RespondIoUserListResponse {
  items: RespondIoUser[];
  pagination?: {
    next?: string;
    previous?: string;
  };
}

// --- Contact Dropdown ---
export const contactIdentifierDropdown = Property.Dropdown({
  displayName: 'Contact',
  description: 'Select the contact.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Respond.io account first',
      };
    }
    try {
      const response = await respondIoApiCall<RespondIoContactListResponse>({
        auth: auth as PiecePropValueSchema<typeof respondIoAuth>,
        method: HttpMethod.POST,
        url: '/contact/list',
        body: {
          search: '',
          filter: {
            $and: [],
          },
          timezone: 'UTC',
        },
      });
      const contacts = response.items;
      if (contacts.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No contacts found in your workspace.',
        };
      }
      return {
        disabled: false,
        options: contacts.map((contact) => {
          const contactInfo =
            contact.email || contact.phone || `ID: ${contact.id}`;
          return {
            label: `${contact.firstName || ''} ${
              contact.lastName || ''
            } (${contactInfo})`.trim(),
            value: `id:${contact.id}`,
          };
        }),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading contacts: ${errorMessage}`,
      };
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
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Respond.io account first',
      };
    }

    try {
      const response = await respondIoApiCall<RespondIoUserListResponse>({
        auth: auth as PiecePropValueSchema<typeof respondIoAuth>,
        method: HttpMethod.GET,
        url: '/space/user',
      });

      const users = response.items;

      if (users.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No users found in your workspace.',
        };
      }

      return {
        disabled: false,
        options: [
          {
            label: 'Unassigned',
            value: 'null', // MUST be string "null"
          },
          ...users.map((user) => ({
            label: `${user.firstName} ${user.lastName} (${user.email})`,
            value: user.id.toString(), // always string
          })),
        ],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading users: ${errorMessage}`,
      };
    }
  },
});
