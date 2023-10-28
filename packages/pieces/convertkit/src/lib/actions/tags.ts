import {
    createAction,
    Property,
    DynamicPropsValue,
  } from '@activepieces/pieces-framework';
  import { convertkitAuth } from '../..';
  import { CONVERTKIT_API_URL } from '../common';
  import { propertyCustomFields} from './custom-fields';
  
  const API_ENDPOINT = 'tags';

  export const getTags = async (auth: string) => {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/?api_secret=${auth}`;
    const response = await fetch(url);
    return await response.json();
  }


  export const propertyTags = Property.MultiSelectDropdown({
    displayName: 'Tags',
    description: 'Tags to add to subscriber',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account',
          options: [],
        };
      }

      const tags = await getTags(auth.toString());

      // loop through data and map to options
      const options = tags.tags.map(
        (tag: { id: string; name: string; }) => {
          return {
            label: tag.name,
            value: tag.id,
          };
        }
      );

      return {
        options,
      };
    },
  });

  export const propertyTag = Property.Dropdown({
    displayName: 'Tag',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account',
          options: [],
        };
      }

      const tags = await getTags(auth.toString());

      // loop through data and map to options
      const options = tags.tags.map(
        (tag: { id: string; name: string; }) => {
          return {
            label: tag.name,
            value: tag.id,
          };
        }
      );

      return {
        options,
      };
    },
  });

  export const listTags = createAction({
    auth: convertkitAuth,
    name: 'tags_list_tags',
    displayName: 'Tags: List Tags',
    description: 'Returns a list of all tags',
    props: {},
    async run(context) {
      const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/?api_secret=${context.auth}`;
  
      // Fetch URL using fetch api
      const response = await fetch(url);
  
      // Get response body
      const data = await response.json();
  
      // Return response body
      return data;
    },
  });

  export const createTag = createAction({
    auth: convertkitAuth,
    name: 'tags_create_tag',
    displayName: 'Tags: Create Tag',
    description: 'Create a tag',
    props: {
      name: Property.ShortText({
        displayName: 'Name',
        description: 'The name of the tag',
        required: true,
      }),
    },
    async run(context) {
      const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/?api_secret=${context.auth}`;
  
      // Fetch URL using fetch api
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({tag: context.propsValue}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      // Get response body
      const data = await response.json();
  
      // Return response body
      return data;
    },
  });


  // TODO: Broken!
  export const tagSubscriber = createAction({
    auth: convertkitAuth,
    name: 'tags_tag_subscriber',
    displayName: 'Tags: Tag Subscriber',
    description: 'Tag a subscriber',
    props: {
      email: Property.ShortText({
        displayName: 'Email Address',
        description: 'Email address',
        required: true,
      }),
      tagId: propertyTag,
      first_name: Property.ShortText({
        displayName: 'First Name',
        description: 'The first name of the subscriber',
        required: false,
      }),
      tags: propertyTags,
      fields: propertyCustomFields,
    },
    async run(context) {
      const tagId = context.propsValue.tagId;
      const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${tagId}/subscribe`;
  
      // Fetch URL using fetch api
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 
          email: context.propsValue.email,
          first_name: context.propsValue.first_name,
          fields: context.propsValue.fields,
          tags: context.propsValue.tags,
          api_secret: context.auth
         }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      // Get response body
      const data = await response.json();
  
      // Return response body
      return data;
    },
  });

  