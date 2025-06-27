import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { heygenApiCall } from './client';

export const folderDropdown = Property.Dropdown({
  displayName: 'Folder',
  description: 'Select the folder to store the video.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await heygenApiCall<{ folders: { id: string; name: string }[] }>({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/folders',
      apiVersion: 'v1',
    });

    return {
      disabled: false,
      options: response.folders.map((folder) => ({
        label: folder.name,
        value: folder.id,
      })),
    };
  },
});

export const brandVoiceDropdown = Property.Dropdown({
  displayName: 'Brand Voice',
  description: 'Select the Brand Voice to apply to the video.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await heygenApiCall<{ voices: { id: string; name: string }[] }>({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/brand_voice',
      apiVersion: 'v1',
    });

    return {
      disabled: false,
      options: response.voices.map((voice) => ({
        label: voice.name,
        value: voice.id,
      })),
    };
  },
});

export const templateDropdown = Property.Dropdown({
  displayName: 'Template',
  description: 'Select the template to generate the video.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await heygenApiCall<{ templates: { template_id: string; name: string; aspect_ratio: string }[] }>({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/templates',
      apiVersion: 'v1',
    });

    return {
      disabled: false,
      options: response.templates.map((template) => ({
        label: template.name,
        value: template.template_id,
      })),
    };
  },
});

export const supportedLanguagesDropdown = Property.Dropdown({
  displayName: 'Supported Language',
  description: 'Select the language for video translation.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const response = await heygenApiCall<{ languages: string[] }>({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/video_translate/target_languages',
      apiVersion: 'v2',
    });

    return {
      disabled: false,
      options: response.languages.map((lang) => ({
        label: lang,
        value: lang,
      })),
    };
  },
});
