import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const findTag = createAction({
  auth: mailchimpAuth,
  name: 'find_tag',
  displayName: 'Find Tag',
  description: 'Search for tags on a list by name',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Search query to filter tags (optional - if empty, returns all tags)',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
    
    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      const options: any = {};
      
      if (context.propsValue.name) {
        options.name = context.propsValue.name;
      }

      const result = await client.lists.tagSearch(
        context.propsValue.list_id!,
        options
      );

      return {
        success: true,
        list_id: context.propsValue.list_id,
        search_query: context.propsValue.name || 'All tags',
        tags: result.tags,
        total_items: result.total_items,
        found_tags: result.tags.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to find tag: ${error.message || JSON.stringify(error)}`);
    }
  },
});
