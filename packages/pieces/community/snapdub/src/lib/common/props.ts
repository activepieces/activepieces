import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { snapdubAuth } from '../auth';
import { snapdubClient } from './client';

const templateDropdown = Property.Dropdown({
  auth: snapdubAuth,
  displayName: 'Template',
  description:
    'Apply the style of one of your saved SnapDub templates (captions, layout, branding). Settings you fill in below override the template.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your SnapDub account first',
      };
    }
    try {
      const response = await snapdubClient.call<{
        templates?: { name: string }[];
      }>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/templates',
      });
      const templates = response.templates ?? [];
      return {
        disabled: false,
        options: templates.map((template) => ({
          label: template.name,
          value: template.name,
        })),
        placeholder:
          templates.length === 0
            ? 'No templates yet. Save one in SnapDub first.'
            : undefined,
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: snapdubClient.errorMessage({ error }),
      };
    }
  },
});

const videoIdProp = Property.ShortText({
  displayName: 'Video ID',
  description:
    "The video_id returned by Create Clips or by the Clips Ready trigger, e.g. '9f3c2a71'.",
  required: true,
});

export const snapdubProps = {
  templateDropdown,
  videoIdProp,
};

export const TRANSLATE_LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Polish', value: 'pl' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Russian', value: 'ru' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese (Simplified)', value: 'zh' },
];
