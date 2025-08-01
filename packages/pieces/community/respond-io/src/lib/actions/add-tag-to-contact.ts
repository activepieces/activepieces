import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';
import { contactIdProperty, tagNameProperty } from '../common/utils';

export const addTagToContactAction = createAction({
  auth: respondIoAuth,
  name: 'add_tag_to_contact',
  displayName: 'Add Tag to Contact',
  description: 'Add one or more tags to a contact for organization and segmentation',
  props: {
    contactId: contactIdProperty,
    tagName: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag to add to the contact',
      required: true
    }),
    additionalTags: Property.Array({
      displayName: 'Additional Tags',
      description: 'Additional tags to add to the contact',
      required: false,
      properties: {
        tagName: Property.ShortText({
          displayName: 'Tag Name',
          required: true
        })
      }
    }),
    createTagIfNotExists: Property.Checkbox({
      displayName: 'Create Tag if Not Exists',
      description: 'Create the tag if it does not already exist in your Respond.io account',
      required: false,
      defaultValue: true
    })
  },
  async run(context) {
    const { contactId, tagName, additionalTags, createTagIfNotExists } = context.propsValue;
    const client = new RespondIoClient(context.auth);

    try {
      // Validate inputs
      if (!contactId || contactId.trim() === '') {
        throw new Error('Contact ID is required');
      }

      if (!tagName || tagName.trim() === '') {
        throw new Error('Tag name is required');
      }

      // Collect all tags to add
      const tagsToAdd = [tagName.trim()];
      
      if (additionalTags && Array.isArray(additionalTags)) {
        for (const tag of additionalTags) {
          if (tag.tagName && tag.tagName.trim()) {
            tagsToAdd.push(tag.tagName.trim());
          }
        }
      }

      // Remove duplicates
      const uniqueTags = [...new Set(tagsToAdd)];

      // Verify contact exists
      let contactInfo;
      try {
        contactInfo = await client.getContact(contactId);
      } catch (error: any) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw new Error(`Contact with ID '${contactId}' not found`);
        }
        throw error;
      }

      const results = [];
      const errors = [];

      // Add each tag
      for (const tag of uniqueTags) {
        try {
          const tagData = {
            name: tag,
            createIfNotExists: createTagIfNotExists
          };

          const result = await client.addTagToContact(contactId, tagData);
          
          results.push({
            tagName: tag,
            success: true,
            result: result
          });
        } catch (error: any) {
          errors.push({
            tagName: tag,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;

      return {
        success: errorCount === 0,
        contactId,
        contactName: contactInfo.fullName || contactInfo.firstName || 'Unknown',
        tagsProcessed: uniqueTags.length,
        successfulTags: successCount,
        failedTags: errorCount,
        results,
        errors: errors.length > 0 ? errors : undefined,
        message: errorCount === 0 
          ? `Successfully added ${successCount} tag(s) to contact`
          : `Added ${successCount} tag(s), failed to add ${errorCount} tag(s)`
      };

    } catch (error: any) {
      throw new Error(`Failed to add tag to contact: ${error.message}`);
    }
  }
});
