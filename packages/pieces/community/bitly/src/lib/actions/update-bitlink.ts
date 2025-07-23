import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid } from '../common/props';

export const updateBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'update_bitlink',
  displayName: 'Update Bitlink',
  description:
    'Updates fields in a specified Bitlink, such as the title or tags.',
  props: {
    group_guid: groupGuid,
    bitlink: bitlinkDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title for the Bitlink.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description:
        'Set to "true" to archive the Bitlink, or "false" to unarchive it.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'A new list of tags to apply to the Bitlink. This will overwrite existing tags.',
      required: false,
    }),
    deeplinks: Property.Json({
      displayName: 'Deeplinks',
      description:
        'Update the mobile deeplinking behavior. This will overwrite existing deeplinks.',
      required: false,
    }),
  },
  async run(context) {
    const { bitlink, title, archived, tags, deeplinks } = context.propsValue;

    try {
      const body: Record<string, unknown> = {};

      if (title !== undefined && title !== null) {
        body['title'] = title;
      }
      if (archived !== undefined && archived !== null) {
        body['archived'] = archived;
      }
      if (tags !== undefined && tags !== null && Array.isArray(tags)) {
        body['tags'] = tags;
      }
      if (deeplinks !== undefined && deeplinks !== null) {
        const parsedDeeplinks =
          typeof deeplinks === 'string' ? JSON.parse(deeplinks) : deeplinks;
        if (Array.isArray(parsedDeeplinks)) {
          const validDeeplinks = parsedDeeplinks.filter(
            (link) =>
              link.app_id &&
              link.app_uri_path &&
              link.install_url &&
              link.install_type
          );
          body['deeplinks'] = validDeeplinks;
        }
      }

      if (Object.keys(body).length === 0) {
        throw new Error(
          'No fields were provided to update. Please provide a title, tags, archive status, or deeplinks.'
        );
      }

      return await bitlyApiCall({
        method: HttpMethod.PATCH,
        auth: context.auth,
        resourceUri: `/bitlinks/${bitlink}`,
        body,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.description ||
        error.response?.data?.message ||
        error.message;

      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded. Please wait before trying again.'
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          `Bitlink not found: ${errorMessage}. Please verify the link (e.g., 'bit.ly/xyz123') is correct.`
        );
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(
          `Authentication failed or forbidden: ${errorMessage}. Please check your Access Token and permissions.`
        );
      }

      if (error.message.includes('Invalid JSON format')) {
        throw error;
      }

      throw new Error(
        `Failed to update Bitlink: ${errorMessage || 'Unknown error occurred'}`
      );
    }
  },
});
