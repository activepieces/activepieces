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
          auth: auth as string,
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
          auth: auth as string,
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

  tagsMultiSelectDropdown: Property.MultiSelectDropdown({
    displayName: 'Tags',
    description: 'Select tags to assign to the contact',
    required: false,
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
          auth: auth as string,
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
              label: tag.name || tag.id,
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
          auth: auth as string,
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
          auth: auth as string,
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

  contactFields: Property.Array({
    displayName: 'Custom Contact Fields',
    description: 'Add custom contact field values (e.g., country, company, etc.)',
    required: false,
    properties: {
      field: Property.ShortText({
        displayName: 'Field Slug',
        description: 'Enter the field slug (e.g., country, company, custom1)',
        required: true,
      }),
      value: Property.ShortText({
        displayName: 'Value',
        description: 'Enter the field value',
        required: false,
      }),
    },
  }),

  contactFieldDropdown: Property.Dropdown({
    displayName: 'Contact Field',
    description: 'Select a contact field',
    required: false,
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
        const response = await systemeIoCommon.getContactFields({
          auth: auth as string,
        });

        let fields: any[] = [];
        if (Array.isArray(response)) {
          fields = response;
        } else if (response && typeof response === 'object' && response !== null) {
          const responseAny = response as any;
          if (responseAny.items && Array.isArray(responseAny.items)) {
            fields = responseAny.items;
          }
        }

        if (fields.length > 0) {
          return {
            disabled: false,
            options: fields.map((field: any) => ({
              label: field.fieldName || field.slug,
              value: field.slug,
            })),
          };
        }

        return {
          disabled: true,
          placeholder: 'No contact fields found',
          options: [],
        };
      } catch (error) {
        console.error('Error fetching contact fields:', error);
        return {
          disabled: true,
          placeholder: 'Error loading contact fields',
          options: [],
        };
      }
    },
  }),
};
