import { Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { MarkyBusiness, MarkyTopic, markyCommon } from './client';

const businessId = Property.Dropdown({
  displayName: 'Business',
  description:
    'The Marky business (workspace) this step works on. Every post, topic and library item belongs to one business.',
  required: true,
  refreshers: [],
  auth: markyAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Marky account first.',
      };
    }

    try {
      const businesses = await markyCommon.fetchAllPages<MarkyBusiness>({
        apiKey: auth.secret_text,
        path: '/businesses',
      });

      if (businesses.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No businesses found in this Marky organization.',
        };
      }

      return {
        disabled: false,
        options: businesses.map((business) => ({
          label: business.name ?? business.id,
          value: business.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load businesses. Check your connection.',
      };
    }
  },
});

const topicId = Property.Dropdown({
  displayName: 'Topic',
  description: 'The topic to work on.',
  required: true,
  refreshers: ['businessId'],
  auth: markyAuth,
  options: async ({ auth, businessId }) => {
    if (!auth) {
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

    try {
      const topics = await markyCommon.fetchAllPages<MarkyTopic>({
        apiKey: auth.secret_text,
        path: `/businesses/${businessId}/topics`,
      });

      if (topics.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No topics found for this business.',
        };
      }

      return {
        disabled: false,
        options: topics.map((topic) => ({
          label: topic.title,
          value: topic.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load topics. Check your connection.',
      };
    }
  },
});

const restrictPublishTo = Property.StaticMultiSelectDropdown({
  displayName: 'Platforms',
  description:
    'Restrict publishing to these platforms. Leave empty to publish to every social account connected to the business.',
  required: false,
  options: {
    options: [
      { label: 'Facebook', value: 'facebook' },
      { label: 'Instagram', value: 'instagram' },
      { label: 'Instagram Story', value: 'instagramStory' },
      { label: 'LinkedIn Page', value: 'linkedIn' },
      { label: 'LinkedIn Profile', value: 'linkedInProfile' },
      { label: 'Twitter / X', value: 'twitter' },
      { label: 'TikTok', value: 'tiktok' },
      { label: 'Pinterest', value: 'pinterest' },
      { label: 'YouTube', value: 'youtube' },
      { label: 'Google Business', value: 'googleBusiness' },
    ],
  },
});

const postStatusFilter = Property.StaticDropdown({
  displayName: 'Status',
  description: 'Only return posts in this status. Leave empty to return every post.',
  required: false,
  options: {
    options: [
      { label: 'New (awaiting review)', value: 'NEW' },
      { label: 'Draft (approved by a reviewer)', value: 'DRAFT' },
      { label: 'Rejected', value: 'REJECTED' },
      { label: 'Scheduled', value: 'SCHEDULED' },
      { label: 'Published', value: 'PUBLISHED' },
    ],
  },
});

export const markyProps = {
  businessId,
  topicId,
  restrictPublishTo,
  postStatusFilter,
};
