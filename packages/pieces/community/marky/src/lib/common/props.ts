import { Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient } from './client';

function business(required = true) {
  return Property.Dropdown({
    displayName: 'Business',
    description: 'Select the Marky business (workspace) to use.',
    required,
    refreshers: [],
    auth: markyAuth,
    options: async ({ auth }) => {
      if (!auth || auth.secret_text.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Marky account first.',
        };
      }

      const result = await markyClient.listBusinesses({ apiKey: auth.secret_text });

      if (!result.ok) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load businesses. Check your connection.',
        };
      }

      if (result.data.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No businesses found in Marky.',
        };
      }

      return {
        disabled: false,
        options: result.data.map((item) => ({
          label: item.title ?? item.id,
          value: item.id,
        })),
      };
    },
  });
}

function topic(required = true) {
  return Property.Dropdown({
    displayName: 'Topic',
    description: 'Select the Marky topic to use.',
    required,
    refreshers: ['businessId'],
    auth: markyAuth,
    options: async ({ auth, businessId }) => {
      if (!auth || auth.secret_text.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Marky account first.',
        };
      }

      if (typeof businessId !== 'string' || businessId.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a business first.',
        };
      }

      const result = await markyClient.listTopics({
        apiKey: auth.secret_text,
        businessId,
      });

      if (!result.ok) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load topics. Check your connection.',
        };
      }

      if (result.data.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No topics found for this business.',
        };
      }

      return {
        disabled: false,
        options: result.data.map((item) => ({
          label: item.title,
          value: item.id,
        })),
      };
    },
  });
}

function platforms(required = false) {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Platforms',
    description:
      'Target social media platforms. Defaults to all connected platforms when empty.',
    required,
    options: { options: PLATFORM_OPTIONS },
  });
}

function postStatus(required = false) {
  return Property.StaticDropdown({
    displayName: 'Status Filter',
    description: 'Filter posts by status.',
    required,
    options: {
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
      ],
    },
  });
}

const PLATFORM_OPTIONS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Twitter / X', value: 'twitter' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Pinterest', value: 'pinterest' },
  { label: 'Bluesky', value: 'bluesky' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Threads', value: 'threads' },
  { label: 'Snapchat', value: 'snapchat' },
  { label: 'Telegram', value: 'telegram' },
];

const markyProps = { business, topic, platforms, postStatus };

export { markyProps };
