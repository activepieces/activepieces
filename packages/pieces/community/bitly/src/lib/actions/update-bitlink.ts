import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid } from '../common/props';

export const updateBitlinkAction = createAction({
  auth: bitlyAuth,
  name: 'update_bitlink',
  classification: 'WRITE',
  displayName: 'Update Bitlink',
  description: 'Modify properties of an existing Bitlink.',
  audience: 'both',
  aiMetadata: { description: 'Updates properties of an existing Bitlink identified by its Bitlink ID, including title, archive status, tags (overwrites existing), and mobile app deeplinks. Use to edit or re-tag a known short link; at least one field must be provided. Idempotent: applying the same values repeatedly yields the same final state.', idempotent: true },
  props: {
    group_guid: groupGuid,
    bitlink: bitlinkDropdown,
    changes_info: Property.MarkDown({
      value: 'Title and tags left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Empty keeps the current title.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'On archives the link, off makes it active again.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Replaces all current tags. Empty keeps them.',
      required: false,
    }),
    // Mobile App Deeplink Configuration
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
    os: Property.StaticDropdown({
      displayName: 'Mobile OS',
      description: 'Platform it targets.',
      required: false,
      width: 'half',
      options: {
        disabled: false,
        options: [
          { label: 'iOS', value: 'ios' },
          { label: 'Android', value: 'android' },
        ],
      },
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
      key: 'target',
      display: 'section',
      label: 'Link to Update',
      icon: 'send',
      props: ['group_guid', 'bitlink'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'tag',
      props: ['changes_info', 'title', 'tags', 'archived'],
    },
    {
      key: 'deeplink',
      display: 'section',
      label: 'Mobile App Deeplink',
      icon: 'sliders',
      props: ['app_uri_path', 'os', 'install_url', 'install_type'],
    },
  ],
  async run(context) {
    const { 
      bitlink, 
      title, 
      archived, 
      tags, 
      app_uri_path,
      install_url,
      os,
      install_type 
    } = context.propsValue;

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
      
      // Build deeplinks array if app configuration is provided
      if (app_uri_path || install_url || os || install_type) {
        const deeplink: Record<string, unknown> = {};
        
        if (app_uri_path) deeplink['app_uri_path'] = app_uri_path;
        if (install_url) deeplink['install_url'] = install_url;
        if (os) deeplink['os'] = os;
        if (install_type) deeplink['install_type'] = install_type;
        
        if (Object.keys(deeplink).length > 0) {
          body['deeplinks'] = [deeplink];
        }
      }

      if (Object.keys(body).length === 0) {
        throw new Error(
          'No fields were provided to update. Please provide a title, tags, archive status, or deeplinks.'
        );
      }

      return await bitlyApiCall({
        method: HttpMethod.PATCH,
        auth: context.auth.props,
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
