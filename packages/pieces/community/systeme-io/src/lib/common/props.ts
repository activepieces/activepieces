import { Property } from '@activepieces/pieces-framework';
import { systemeIoCommon } from './client';

export const systemeIoProps = {
  contactDropdown: Property.Dropdown({
    displayName: 'Contact',
    description: 'Select a contact',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }

      try {
        const response = await systemeIoCommon.getContacts({
          auth: auth as { apiKey: string },
          limit: 100,
        });

        let contacts: any[] = [];
        if (Array.isArray(response)) {
          contacts = response;
        } else if (response && typeof response === 'object' && response !== null) {
          const responseAny = response as any;
          if (responseAny.items && Array.isArray(responseAny.items)) {
            contacts = responseAny.items;
          }
        }

        if (contacts.length > 0) {
          return {
            disabled: false,
            options: contacts.map((contact: any) => ({
              label: `${contact.first_name || ''} ${contact.last_name || ''} (${contact.email})`.trim(),
              value: contact.id,
            })),
          };
        }

        return {
          disabled: true,
          placeholder: 'No contacts found',
          options: [],
        };
      } catch (error) {
        console.error('Error fetching contacts:', error);
        return {
          disabled: true,
          placeholder: 'Error loading contacts',
          options: [],
        };
      }
    },
  }),

  tagDropdown: Property.Dropdown({
    displayName: 'Tag',
    description: 'Select a tag',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }

      try {
        const response = await systemeIoCommon.getTags({
          auth: auth as { apiKey: string },
        });

        let tags: any[] = [];
        if (Array.isArray(response)) {
          tags = response;
        } else if (response && typeof response === 'object' && response !== null) {
          const responseAny = response as any;
          if (responseAny.items && Array.isArray(responseAny.items)) {
            tags = responseAny.items;
          }
        }

        if (tags.length > 0) {
          return {
            disabled: false,
            options: tags.map((tag: any) => ({
              label: tag.name,
              value: tag.id,
            })),
          };
        }

        return {
          disabled: true,
          placeholder: 'No tags found',
          options: [],
        };
      } catch (error) {
        console.error('Error fetching tags:', error);
        return {
          disabled: true,
          placeholder: 'Error loading tags',
          options: [],
        };
      }
    },
  }),

  contactIdDropdown: Property.Dropdown({
    displayName: 'Contact ID',
    description: 'Select a contact by ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }

      try {
        const response = await systemeIoCommon.getContacts({
          auth: auth as { apiKey: string },
          limit: 100,
        });

        let contacts: any[] = [];
        if (Array.isArray(response)) {
          contacts = response;
        } else if (response && typeof response === 'object' && response !== null) {
          const responseAny = response as any;
          if (responseAny.items && Array.isArray(responseAny.items)) {
            contacts = responseAny.items;
          }
        }

        if (contacts.length > 0) {
          return {
            disabled: false,
            options: contacts.map((contact: any) => ({
              label: `ID: ${contact.id} - ${contact.first_name || ''} ${contact.last_name || ''} (${contact.email})`.trim(),
              value: contact.id,
            })),
          };
        }

        return {
          disabled: true,
          placeholder: 'No contacts found',
          options: [],
        };
      } catch (error) {
        console.error('Error fetching contacts:', error);
        return {
          disabled: true,
          placeholder: 'Error loading contacts',
          options: [],
        };
      }
    },
  }),

  tagNameDropdown: Property.Dropdown({
    displayName: 'Tag Name',
    description: 'Select a tag by name',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }

      try {
        const response = await systemeIoCommon.getTags({
          auth: auth as { apiKey: string },
        });

        let tags: any[] = [];
        if (Array.isArray(response)) {
          tags = response;
        } else if (response && typeof response === 'object' && response !== null) {
          const responseAny = response as any;
          if (responseAny.items && Array.isArray(responseAny.items)) {
            tags = responseAny.items;
          }
        }

        if (tags.length > 0) {
          return {
            disabled: false,
            options: tags.map((tag: any) => ({
              label: tag.name,
              value: tag.name,
            })),
          };
        }

        return {
          disabled: true,
          placeholder: 'No tags found',
          options: [],
        };
      } catch (error) {
        console.error('Error fetching tags:', error);
        return {
          disabled: true,
          placeholder: 'Error loading tags',
          options: [],
        };
      }
    },
  }),
};
