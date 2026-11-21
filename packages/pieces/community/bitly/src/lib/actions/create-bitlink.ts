import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { groupGuid, domain } from '../common/props';

export const createBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'create_bitlink',
  classification: 'WRITE',
  displayName: 'Create Bitlink',
  description: 'Shorten a long URL with optional customization.',
  audience: 'both',
  aiMetadata: { description: 'Shortens a long URL into a Bitlink, optionally setting title, tags, custom branded domain, and mobile app deeplinks. Use to create a trackable short link from a destination URL (must start with http:// or https://). Not idempotent: each call creates a link, though Bitly may return an existing Bitlink for the same URL unless Force New Link is enabled.', idempotent: false },
  props: {
    long_url: Property.ShortText({
      displayName: 'Long URL',
      description: 'The page to open. Must start with http:// or https://.',
      placeholder: 'https://example.com/landing-page',
      required: true,
    }),
    group_guid: groupGuid,
    domain: {
      ...domain,
      defaultValue: 'bit.ly',
    },
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Shown in your Bitly account.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Labels for finding the link in Bitly.',
      required: false,
    }),
    force_new_link: Property.Checkbox({
      displayName: 'Force New Link',
      description: 'Create a new link even if this URL already has one.',
      required: false,
      defaultValue: false,
    }),
    // Mobile App Deeplink Configuration
    deeplink_info: Property.MarkDown({
      value: 'The app deeplink is only added when all four fields below are filled.',
      variant: MarkdownVariant.WARNING,
    }),
    app_id: Property.ShortText({
      displayName: 'App ID',
      description: 'Bundle or package ID.',
      placeholder: 'com.example.app',
      required: false,
      width: 'half',
    }),
    app_uri_path: Property.ShortText({
      displayName: 'App Path',
      description: 'Path inside the app.',
      placeholder: '/product/123',
      required: false,
      width: 'half',
    }),
    install_url: Property.LongText({
      displayName: 'App Install URL',
      description: 'Where people without the app can install it.',
      placeholder: 'https://apps.apple.com/app/id123456789',
      required: false,
    }),
    install_type: Property.StaticDropdown({
      displayName: 'Install Type',
      description: 'What happens when the app is not installed.',
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
  propertyGroups: [
    {
      key: 'link',
      display: 'section',
      label: 'Link',
      icon: 'send',
      props: ['long_url', 'group_guid', 'domain'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      icon: 'tag',
      props: ['title', 'tags', 'force_new_link'],
    },
    {
      key: 'deeplink',
      display: 'section',
      label: 'Mobile App Deeplink',
      icon: 'sliders',
      props: ['deeplink_info', 'app_id', 'app_uri_path', 'install_url', 'install_type'],
    },
  ],
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
        auth: context.auth.props,
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
