import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { groupGuid, domain } from '../common/props';

export const createBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'create_bitlink',
  displayName: 'Create Bitlink',
  description: 'Shorten a long URL with optional customization.',
  props: {
    long_url: Property.ShortText({
      displayName: 'Long URL',
      description: 'The URL to shorten (must include http:// or https://).',
      required: true,
    }),
    group_guid: groupGuid,
    domain: {
      ...domain,
      defaultValue: 'bit.ly',
    },
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Custom title for the Bitlink.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the Bitlink.',
      required: false,
    }),
    force_new_link: Property.Checkbox({
      displayName: 'Force New Link',
      description: 'Create new link even if one exists for this URL.',
      required: false,
      defaultValue: false,
    }),
    // Mobile App Deeplink Configuration
    app_id: Property.ShortText({
      displayName: 'Mobile App ID',
      description: 'Mobile app identifier (e.g., com.yourapp.name).',
      required: false,
    }),
    app_uri_path: Property.ShortText({
      displayName: 'App URI Path',
      description: 'Path within the mobile app (e.g., /product/123).',
      required: false,
    }),
    install_url: Property.LongText({
      displayName: 'App Install URL',
      description: 'URL where users can install the mobile app.',
      required: false,
    }),
    install_type: Property.StaticDropdown({
      displayName: 'Install Type',
      description: 'How to handle app installation.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'No Install', value: 'no_install' },
          { label: 'Auto Install', value: 'auto_install' },
          { label: 'Promote Install', value: 'promote_install' },
        ],
      },
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
      app_id,
      app_uri_path,
      install_url,
      install_type,
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
      
      // Build deeplinks array if app configuration is provided
      if (app_id && app_uri_path && install_url && install_type) {
        body['deeplinks'] = [
          {
            app_id,
            app_uri_path,
            install_url,
            install_type,
          },
        ];
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
