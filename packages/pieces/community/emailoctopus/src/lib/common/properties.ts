import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusCommon } from './client';

export const listDropdown = ({ required = true }: { required?: boolean }) =>
  Property.Dropdown({
    displayName: 'List',
    description: 'Select the list',
    required: required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your EmailOctopus account first',
          options: [],
        };
      }

      try {
        const response = await emailoctopusCommon.apiCall({
          auth: auth as string,
          method: HttpMethod.GET,
          resourceUri: '/lists',
        });

        const lists = response.body?.data || [];
        if (lists.length === 0) {
          return {
            disabled: true,
            placeholder: 'No lists found',
            options: [],
          };
        }

        return {
          options: lists.map((list: any) => ({
            label: list.name,
            value: list.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load lists',
          options: [],
        };
      }
    },
  });

export const contactDropdown = ({ required = true }: { required?: boolean }) =>
  Property.Dropdown({
    displayName: 'Contact',
    description: 'Select the contact',
    required: required,
    refreshers: ['auth', 'list_id'],
    options: async ({ auth, list_id }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your EmailOctopus account first',
          options: [],
        };
      }

      if (!list_id) {
        return {
          disabled: true,
          placeholder: 'Select a list first',
          options: [],
        };
      }

      try {
        const response = await emailoctopusCommon.apiCall({
          auth: auth as string,
          method: HttpMethod.GET,
          resourceUri: `/lists/${list_id}/contacts`,
        });

        const contacts = response.body?.data || [];
        if (contacts.length === 0) {
          return {
            disabled: true,
            placeholder: 'No contacts found in this list',
            options: [],
          };
        }

        return {
          options: contacts.map((contact: any) => ({
            label: `${contact.email_address}${contact.fields?.first_name || contact.fields?.last_name ? ` (${[contact.fields?.first_name, contact.fields?.last_name].filter(Boolean).join(' ')})` : ''}`,
            value: contact.id,
          })),
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

export const tagDropdown = ({ required = true }: { required?: boolean }) =>
  Property.Dropdown({
    displayName: 'Tag',
    description: 'Select the tag',
    required: required,
    refreshers: ['auth', 'list_id'],
    options: async ({ auth, list_id }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your EmailOctopus account first',
          options: [],
        };
      }

      if (!list_id) {
        return {
          disabled: true,
          placeholder: 'Select a list first',
          options: [],
        };
      }

      try {
        const response = await emailoctopusCommon.apiCall({
          auth: auth as string,
          method: HttpMethod.GET,
          resourceUri: `/lists/${list_id}/tags`,
        });

        const tags = response.body?.data || [];
        if (tags.length === 0) {
          return {
            disabled: true,
            placeholder: 'No tags found in this list',
            options: [],
          };
        }

        return {
          options: tags.map((tag: any) => ({
            label: tag.tag,
            value: tag.tag,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load tags',
          options: [],
        };
      }
    },
  });

export const addUpdateContactProps = () => ({
  list_id: listDropdown({ required: true }),
  email_address: Property.ShortText({
    displayName: 'Email Address',
    description: 'The email address of the contact',
    required: true,
  }),
  fields: Property.Object({
    displayName: 'Custom Fields',
    description: 'An object containing key/value pairs of field values',
    required: false,
  }),
  tags: Property.Array({
    displayName: 'Tags',
    description: 'Tags to add to the contact',
    required: false,
    properties: {
      tag: Property.ShortText({
        displayName: 'Tag Name',
        description: 'The name of the tag to add',
        required: true,
      })
    }
  }),
  status: Property.StaticDropdown({
    displayName: 'Status',
    description: 'The status of the contact',
    required: false,
    options: {
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Pending', value: 'pending' }
      ]
    }
  }),
});


export const unsubscribeContactProps = () => ({
  contact_id: contactDropdown({ required: true }),
});

export const updateContactEmailProps = () => ({
  contact_id: contactDropdown({ required: true }),
  email_address: Property.ShortText({
    displayName: 'New Email Address',
    description: 'The new email address for the contact',
    required: true,
  }),
});

export const addTagToContactProps = () => ({
  list_id: listDropdown({ required: true }),
  contact_id: contactDropdown({ required: true }),
  tag: tagDropdown({ required: true }),
});

export const removeTagFromContactProps = () => ({
  list_id: listDropdown({ required: true }),
  contact_id: contactDropdown({ required: true }),
  tag: tagDropdown({ required: true }),
});

export const createListProps = () => ({
  name: Property.ShortText({
    displayName: 'List Name',
    description: 'The name of the list to create',
    required: true,
  }),
});
