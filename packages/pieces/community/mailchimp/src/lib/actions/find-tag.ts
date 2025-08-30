import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const findTag = createAction({
  auth: mailchimpAuth,
  name: 'find_tag',
  displayName: 'Find Tag',
  description: 'Search for tags in a Mailchimp audience by name (partial matches supported).',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag to search for (optional - if empty, returns all tags)',
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

      // Try official Mailchimp tag search endpoint
      const result = await client.lists.tagSearch(context.propsValue.list_id!, options);

      return {
        success: true,
        list_id: context.propsValue.list_id,
        search_query: context.propsValue.name || 'All tags',
        tags: result.tags,
        total_items: result.total_items,
        found_tags: result.tags.length,
      };
    } catch (error: any) {
      // Fallback to segments if tagSearch is unavailable
      try {
        const segmentsResponse = await mailchimpCommon.makeApiRequest(
          context.auth,
          `/lists/${context.propsValue.list_id}/segments`
        );

        let segments = segmentsResponse.body.segments || [];
        if (context.propsValue.name) {
          const query = context.propsValue.name.toLowerCase();
          segments = segments.filter((s: any) => s.name?.toLowerCase().includes(query));
        }

        return {
          success: true,
          list_id: context.propsValue.list_id,
          search_query: context.propsValue.name || 'All tags',
          tags: segments.map((s: any) => ({
            id: s.id,
            name: s.name,
            member_count: s.member_count,
            type: s.type,
          })),
          total_items: segments.length,
          found_tags: segments.length,
          fallback_used: true,
        };
      } catch (fallbackError: any) {
        throw new Error(
          `Failed to find tags: ${error.message || JSON.stringify(error)}`
        );
      }
    }
  },
});
