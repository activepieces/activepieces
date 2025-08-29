import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const findTag = createAction({
  auth: mailchimpAuth,
  name: 'find_tag',
  displayName: 'Find Tag',
  description: 'Search for tags in a Mailchimp audience',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag to search for (partial matches supported)',
      required: false,
    }),
  },
  async run(context) {
    try {
      const listId = context.propsValue.list_id!;
      let endpoint = `/lists/${listId}/tag-search`;

      if (context.propsValue.tag_name) {
        endpoint += `?name=${encodeURIComponent(context.propsValue.tag_name)}`;
      }

      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        endpoint
      );

      const tags = response.body.tags || [];

      return {
        tags,
        total_items: tags.length,
      };
    } catch (error) {
      // If tag-search endpoint doesn't exist, fall back to getting all segments/tags
      try {
        const segmentsResponse = await mailchimpCommon.makeApiRequest(
          context.auth,
          `/lists/${context.propsValue.list_id}/segments`
        );

        let segments = segmentsResponse.body.segments || [];

        // Filter by tag name if provided
        if (context.propsValue.tag_name) {
          const tagName = context.propsValue.tag_name.toLowerCase();
          segments = segments.filter((segment: any) => 
            segment.name?.toLowerCase().includes(tagName)
          );
        }

        return {
          tags: segments.map((segment: any) => ({
            id: segment.id,
            name: segment.name,
            member_count: segment.member_count,
            type: segment.type,
          })),
          total_items: segments.length,
        };
      } catch (fallbackError) {
        throw new Error(`Failed to find tags: ${JSON.stringify(error)}`);
      }
    }
  },
});
