import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { groupGuid, domain } from '../common/props';

export const createBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'create_bitlink',
  displayName: 'Create Bitlink',
  description:
    'Converts a long url to a Bitlink and sets additional parameters.',
  props: {
    long_url: Property.ShortText({
      displayName: 'Long URL',
      description: 'The URL to shorten (must include http:// or https://).',
      required: true,
    }),
    group_guid: groupGuid,
    domain: domain,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'A custom title for the Bitlink.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'A list of tags to apply to the Bitlink.',
      required: false,
    }),
    force_new_link: Property.Checkbox({
      displayName: 'Force New Link',
      description:
        'If true, a new short link will be created even if a Bitlink for this long URL already exists.',
      required: false,
      defaultValue: false,
    }),
    deeplinks: Property.Json({
      displayName: 'Deeplinks',
      description: 'Add mobile deeplinking behavior to the Bitlink.',
      required: false,
    }),
  },
  async run(context) {
    const {
      long_url,
      group_guid,
      domain,
      title,
      tags,
      force_new_link,
      deeplinks,
    } = context.propsValue;

    try {
      // Pre-flight validation
      if (!long_url.startsWith('http://') && !long_url.startsWith('https://')) {
        throw new Error(
          "Invalid Long URL. It must start with 'http://' or 'https://'."
        );
      }

      const body: Record<string, unknown> = { long_url };

      if (group_guid) {
        body['group_guid'] = group_guid;
      }
      if (domain) {
        body['domain'] = domain;
      }
      if (title) {
        body['title'] = title;
      }
      if (tags && tags.length > 0) {
        body['tags'] = tags;
      }
      if (force_new_link) {
        body['force_new_link'] = force_new_link;
      }
      if (deeplinks) {
        const parsedDeeplinks =
          typeof deeplinks === 'string' ? JSON.parse(deeplinks) : deeplinks;
        if (Array.isArray(parsedDeeplinks) && parsedDeeplinks.length > 0) {
          const validDeeplinks = parsedDeeplinks.filter(
            (link) =>
              link.app_id &&
              link.app_uri_path &&
              link.install_url &&
              link.install_type
          );
          if (validDeeplinks.length > 0) {
            body['deeplinks'] = validDeeplinks;
          }
        }
      }

      return await bitlyApiCall({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: '/bitlinks',
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

      if (error.response?.status === 422) {
        throw new Error(
          `Unprocessable Entity: ${errorMessage}. Please check the format of your Long URL or other inputs.`
        );
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(
          `Authentication failed or forbidden: ${errorMessage}. Please check your Access Token and permissions.`
        );
      }

      throw new Error(
        `Failed to create Bitlink: ${errorMessage || 'Unknown error occurred'}`
      );
    }
  },
});
