import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

interface ContactField {
  field: string;
  value: string;
}

interface TagName {
  name: string;
}

export const createContact = createAction({
  auth: systemeIoAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact with email and contact fields from your Systeme.io account, with optional tags',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address',
      required: true,
    }),
    locale: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Contact preferred language',
      required: false,
      defaultValue: 'en',
      options: {
        disabled: false,
        options: [
          { label: 'English', value: 'en' },
          { label: 'French', value: 'fr' },
          { label: 'Spanish', value: 'es' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'German', value: 'de' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Russian', value: 'ru' },
          { label: 'Japanese', value: 'jp' },
          { label: 'Turkish', value: 'tr' },
          { label: 'Arabic', value: 'ar' },
          { label: 'Chinese', value: 'zh' },
          { label: 'Swedish', value: 'sv' },
          { label: 'Romanian', value: 'ro' },
          { label: 'Czech', value: 'cs' },
          { label: 'Hungarian', value: 'hu' },
          { label: 'Slovak', value: 'sk' },
          { label: 'Danish', value: 'dk' },
          { label: 'Indonesian', value: 'id' },
          { label: 'Polish', value: 'pl' },
          { label: 'Greek', value: 'el' },
          { label: 'Serbian', value: 'sr' },
          { label: 'Hindi', value: 'hi' },
          { label: 'Norwegian', value: 'no' },
          { label: 'Thai', value: 'th' },
          { label: 'Albanian', value: 'sq' },
          { label: 'Slovenian', value: 'sl' },
          { label: 'Ukrainian', value: 'ua' },
        ],
      },
    }),
    dynamicContactFields: Property.DynamicProperties({
      displayName: 'Contact Fields',
      description: 'Set contact fields from your Systeme.io account',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        if (!auth) {
          return {};
        }

        try {
          const response = await systemeIoCommon.getContactFields({
            auth: auth as unknown as string,
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

          const dynamicProps: any = {};

          for (const field of fields) {
            dynamicProps[field.slug] = Property.ShortText({
              displayName: field.fieldName || field.slug,
              description: `Set ${field.fieldName || field.slug} for the new contact`,
              required: false,
            });
          }

          return dynamicProps;
        } catch (error) {
          console.error('Error fetching contact fields:', error);
          return {};
        }
      },
    }),
    customFields: systemeIoProps.contactFields,
    tagSource: Property.StaticDropdown({
      displayName: 'Tag Source',
      description: 'Choose how to handle tags for this contact',
      required: false,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
          { label: 'No Tags', value: 'none' },
          { label: 'Use Existing Tags', value: 'existing' },
          { label: 'Create New Tags', value: 'new' },
        ],
      },
    }),
    existingTags: Property.MultiSelectDropdown({
      displayName: 'Existing Tags',
      description: 'Select existing tags to assign',
      required: false,
      refreshers: ['tagSource'],
      options: async ({ auth, tagSource }) => {
        if (!auth || tagSource !== 'existing') {
          return {
            disabled: true,
            placeholder: tagSource === 'new' ? 'Not needed when creating new tags' : 
                        tagSource === 'none' ? 'Not needed when no tags selected' : 
                        'Please connect your account first',
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
    newTagNames: Property.Array({
      displayName: 'New Tag Names',
      description: 'Enter names for new tags to create and assign (only used when "Create New Tags" is selected)',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Tag Name',
          description: 'Enter the tag name',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { 
      email, 
      locale, 
      dynamicContactFields,
      customFields,
      tagSource,
      existingTags,
      newTagNames
    } = context.propsValue;
    
    const fields: any[] = [];
    
    if (dynamicContactFields && typeof dynamicContactFields === 'object') {
      const fieldsObj = dynamicContactFields as Record<string, any>;
      for (const key in fieldsObj) {
        if (Object.prototype.hasOwnProperty.call(fieldsObj, key)) {
          const value = fieldsObj[key];
          if (value !== undefined && value !== null && value !== '') {
            fields.push({
              slug: key,
              value: String(value)
            });
          }
        }
      }
    }

    if (customFields && Array.isArray(customFields)) {
      for (const field of customFields as ContactField[]) {
        if (field.field && field.value) {
          fields.push({
            slug: field.field,
            value: field.value
          });
        }
      }
    }

    const contactData: any = {
      email,
    };

    if (locale) contactData.locale = locale;
    if (fields.length > 0) contactData.fields = fields;

    const contact = await systemeIoCommon.apiCall<{ id: number }>({
      method: HttpMethod.POST,
      url: '/contacts',
      body: contactData,
      auth: context.auth,
    });

    const tagResults = [];
    
    if (tagSource === 'existing' && existingTags && existingTags.length > 0 && contact.id) {
      for (const tagId of existingTags) {
        try {
          const tagResponse = await systemeIoCommon.apiCall({
            method: HttpMethod.POST,
            url: `/contacts/${contact.id}/tags`,
            body: {
              tagId: tagId,
            },
            auth: context.auth,
          });
          
          tagResults.push({
            tagId,
            success: true,
            response: tagResponse,
          });
        } catch (error) {
          tagResults.push({
            tagId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } else if (tagSource === 'new' && newTagNames && Array.isArray(newTagNames)) {
      for (const tagNameObj of newTagNames as TagName[]) {
        const tagName = tagNameObj.name;
        if (!tagName || tagName.trim() === '') continue;
        
        try {
          const tagResponse = await systemeIoCommon.apiCall<{ id: number }>({
            method: HttpMethod.POST,
            url: '/tags',
            body: {
              name: tagName.trim(),
            },
            auth: context.auth,
          });

          if (tagResponse.id) {
            const tagAssignResponse = await systemeIoCommon.apiCall({
              method: HttpMethod.POST,
              url: `/contacts/${contact.id}/tags`,
              body: {
                tagId: tagResponse.id,
              },
              auth: context.auth,
            });

            tagResults.push({
              tagId: tagResponse.id,
              tagName: tagName,
              success: true,
              response: tagAssignResponse,
            });
          }
        } catch (error) {
          tagResults.push({
            tagId: tagName,
            tagName: tagName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      contact,
      tagResults,
      tagSource,
      totalTagsAssigned: tagResults.filter(t => t.success).length,
      dynamicFieldsProcessed: dynamicContactFields ? Object.keys(dynamicContactFields).filter(key => 
        dynamicContactFields[key] !== undefined && 
        dynamicContactFields[key] !== null && 
        dynamicContactFields[key] !== ''
      ).length : 0,
      customFieldsProcessed: customFields ? customFields.length : 0,
      newTagsCreated: tagSource === 'new' ? tagResults.filter(t => t.success).length : 0,
    };
  },
});
