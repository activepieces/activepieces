import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { murfCommon } from '../common/client';
import { DUBBING_TYPES, API_ENDPOINTS, COMMON_LANGUAGES } from '../common/common';

export const createProjectAction = createAction({
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
  }),
  name: 'create-project',
  displayName: 'Create Project (Murf Dub)',
  description: 'Create a new Murf Dub project',
  props: {
    dubApiKey: Property.SecretText({
      displayName: 'Dub API Key',
      description: 'Murf Dub API key (separate from main API key)',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project',
      required: true,
    }),
    dubbingType: Property.StaticDropdown({
      displayName: 'Dubbing Type',
      description: 'Type of dubbing',
      required: true,
      options: {
        options: DUBBING_TYPES,
      },
    }),
    targetLocales: Property.Array({
      displayName: 'Target Locales',
      description: 'Array of target locales',
      required: true,
      properties: {
        locale: Property.StaticDropdown({
          displayName: 'Locale',
          required: true,
          options: {
            options: COMMON_LANGUAGES,
          },
        }),
      },
    }),
    sourceLocale: Property.StaticDropdown({
      displayName: 'Source Locale',
      description: 'Source locale (optional)',
      required: false,
      options: {
        options: [
          { label: 'Auto-detect', value: '' },
          ...COMMON_LANGUAGES,
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Project description (optional)',
      required: false,
    }),
  },
  async run(context) {
    try {
      const requestBody: any = {
        name: context.propsValue.name,
        dubbing_type: context.propsValue.dubbingType,
        target_locales: context.propsValue.targetLocales.map((item: any) => item.locale),
      };

      if (context.propsValue.sourceLocale) {
        requestBody.source_locale = context.propsValue.sourceLocale;
      }
      if (context.propsValue.description) {
        requestBody.description = context.propsValue.description;
      }

      const response = await murfCommon.apiCallWithApiKey({
        apiKey: context.propsValue.dubApiKey,
        method: 'POST' as any,
        resourceUri: API_ENDPOINTS.CREATE_PROJECT,
        body: requestBody,
      });

      return {
        project_id: response.body.project_id,
        name: response.body.name,
        dubbing_type: response.body.dubbing_type,
        target_locales: response.body.target_locales,
        source_locale: response.body.source_locale,
        description: response.body.description,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Dub API key. Please check your Murf Dub API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw new Error(`Project creation failed: ${error.message || 'Unknown error'}`);
    }
  },
});
