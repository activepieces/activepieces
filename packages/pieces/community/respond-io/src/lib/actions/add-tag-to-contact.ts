import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const addTagToContact = createAction({
  auth: respondIoAuth,
  name: 'add_tag_to_contact',
  displayName: 'Add Tag to Contact',
  description: 'Add one or multiple tags to a contact in Respond.io.',
  props: {
    identifier: contactIdentifierDropdown,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add to the contact (minimum 1, maximum 10 tags).',
      required: true,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag Name',
          description: 'Name of the tag to add.',
          required: true,
        }),
      },
    }),
  },
  async run({ propsValue, auth }) {
    const { identifier, tags } = propsValue;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      throw new Error('At least one tag is required.');
    }
    if (tags.length > 10) {
      throw new Error('Maximum of 10 tags allowed per request.');
    }

    const tagNames = tags
      .map((tagObj: any) => tagObj.tag)
      .filter((tag) => tag && tag.trim())
      .map((tag) => tag.trim());

    if (tagNames.length === 0) {
      throw new Error('At least one valid tag name is required.');
    }

    return await respondIoApiCall({
      method: HttpMethod.POST,
      url: `/contact/${identifier}/tag`,
      auth: auth,
      body: tagNames,
    });
  },
});
