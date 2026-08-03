import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';

export const listTags = createAction({
  auth: produktlyAuth,
  name: 'list_tags',
  displayName: 'List Tags',
  description: 'List all tags that can be attached to changelog posts.',
  audience: 'both',
  aiMetadata: { description: 'List the tags defined in the Produktly account that can label changelog posts, with their display colours, paginated with limit and offset. Pick this to resolve valid tag names before Create Changelog Post or Update Changelog Post, which only accept tags that already exist. Read-only and idempotent.', idempotent: true },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tags to return (1-100, default 50).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of tags to skip for pagination (default 0).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        name: string;
        backgroundColor: string;
        textColor: string;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/tags',
      queryParams: {
        limit: String(propsValue.limit ?? 50),
        offset: String(propsValue.offset ?? 0),
      },
    });
    return response.body.data.map((tag) => ({
      tag_id: tag.id,
      tag_name: tag.name,
      tag_background_color: tag.backgroundColor,
      tag_text_color: tag.textColor,
    }));
  },
});
