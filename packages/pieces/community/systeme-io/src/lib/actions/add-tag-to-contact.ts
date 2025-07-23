import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

export const addTagToContact = createAction({
  auth: systemeIoAuth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact',
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    tagNames: systemeIoProps.tagsMultiSelectDropdown,
  },
  async run(context) {
    const { contactId, tagNames } = context.propsValue;
    
    const results = [];
    
    if (tagNames && tagNames.length > 0) {
      for (const tagId of tagNames) {
        const response = await systemeIoCommon.apiCall({
          method: HttpMethod.POST,
          url: `/contacts/${contactId}/tags`,
          body: {
            tagId: tagId,
          },
          auth: context.auth,
        });
        
        results.push({
          tagId,
          response,
        });
      }
    }

    return {
      success: true,
      results,
      totalTagsAdded: results.length,
    };
  },
});
