import {
    createAction,
    Property,
  } from '@activepieces/pieces-framework';
  import { convertkitAuth } from '../..';
  import { CONVERTKIT_API_URL, subscriberId } from '../common';
  import { propertyCustomFields} from './custom-fields';
  import { getSubscribedTags, getSubscriberIdByEmail } from './subscriber';
  
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

  export const removeTagFromSubscriberByEmail = createAction({
    auth: convertkitAuth,
    name: 'tags_remove_tag_from_subscriber_by_email',
    displayName: 'Tags: Remove Tag From Subscriber By Email',
    description: 'Remove a tag from a subscriber by email',
    props: {
      email: Property.ShortText({
        displayName: 'Email Address',
        description: 'Email address',
        required: true,
      }),
      tagId: Property.Dropdown({
        displayName: 'Tag',
        description: 'The tag to remove',
        required: true,
        refreshers: ['auth', 'email'],
        options: async ({ auth, email }) => {
          if (!auth) {
            return {
              disabled: true,
              placeholder: 'Connect your account.',
              options: [],
            };
          }
          if (!email) {
            return {
              disabled: true,
              placeholder: 'Provide a subscriber email address.',
              options: [],
            };
          }
  
          const data = await getSubscriberIdByEmail(auth.toString(), email.toString());

          // TODO: handle errors
          if (!data) {
            return {
              disabled: true,
              placeholder: 'Something went wrong.',
              options: [],
            };
          }
          if (data['subscribers'].length === 0) {
            return {
              disabled: true,
              placeholder: 'No subscribers found for this email address.',
              options: [],
            };
          }
          const subscriberId = data['subscribers'][0]['id'];
          const tags = await getSubscribedTags(auth.toString(), subscriberId.toString());
    
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
      }),
    },
    async run(context) {
      const tagId = context.propsValue.tagId;
      const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${tagId}/unsubscribe`;
  
      // Fetch URL using fetch api
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 
          email: context.propsValue.email,
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

  export const removeTagFromSubscriberById = createAction({
    auth: convertkitAuth,
    name: 'tags_remove_tag_from_subscriber_by_id',
    displayName: 'Tags: Remove Tag From Subscriber By Id',
    description: 'Remove a tag from a subscriber by id',
    props: {
      subscriberId: Property.ShortText({
        displayName: 'Subscriber Id',
        description: 'Subscriber id',
        required: true,
      }),
      tagId: Property.Dropdown({
        displayName: 'Tag',
        description: 'The tag to remove',
        required: true,
        refreshers: ['auth', 'subscriberId'],
        options: async ({ auth, subscriberId }) => {
          if (!auth) {
            return {
              disabled: true,
              placeholder: 'Connect your account and',
              options: [],
            };
          }

          if (!subscriberId) {
            return {
              disabled: true,
              placeholder: 'Provide a subscriber id.',
              options: [],
            };
          }
  
          const data = await getSubscribedTags(auth.toString(), subscriberId.toString());
          if (!data) {
            return {
              disabled: true,
              placeholder: 'Something went wrong.',
              options: [],
            };
          }    
          // loop through data and map to options
          const options = data.tags.map(
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
      }),
    },
    async run(context) {
      const tagId = context.propsValue.tagId;
      const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${tagId}/unsubscribe`;
  
      // Fetch URL using fetch api
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 
          id: context.propsValue.subscriberId,
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

  export const listSubscribersToTag = createAction({
    auth: convertkitAuth,
    name: 'tags_list_subscribers_to_tag',
    displayName: 'Tags: List Subscribers To Tag',
    description: 'List all subscribers to a tag',
    props: {
      tagId: propertyTag,
      page: Property.Number({
        displayName: 'Page',
        description: 'Page',
        required: false,
        defaultValue: 1,
      }),
      sort_order: Property.StaticDropdown({
        displayName: 'Sort Order',
        description: 'Sort order',
        required: false,
        options: {options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
        },
      }),
      subscriber_state: Property.StaticDropdown({
        displayName: 'Subscriber State',
        description: 'Subscriber state',
        required: false,
        options: {options: [
          { label: 'Active', value: 'active' },
          { label: 'canceled', value: 'canceled' },
        ],
        },
      }),
    },
    async run(context) {
      const tagId = context.propsValue.tagId;
      const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${tagId}/subscriptions?api_secret=${context.auth}`;
  
      // Fetch URL using fetch api
      const response = await fetch(url);
  
      // Get response body
      const data = await response.json();
  
      // Return response body
      return data;
    },
  });