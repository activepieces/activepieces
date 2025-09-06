import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { murfCommon } from '../common/client';
import { API_ENDPOINTS, COMMON_LANGUAGES } from '../common/common';

export const listVoicesAction = createAction({
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
  }),
  name: 'list-voices',
  displayName: 'List Voices',
  description: 'Get list of available voices',
  props: {
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'Filter by locale (optional)',
      required: false,
      options: {
        options: [
          { label: 'All Locales', value: '' },
          ...COMMON_LANGUAGES,
        ],
      },
    }),
    style: Property.Dropdown({
      displayName: 'Style',
      description: 'Filter by style (optional)',
      required: false,
      refreshers: ['locale'],
      options: async ({ auth, locale }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const queryParams = new URLSearchParams();
          if (locale) {
            queryParams.append('locale', locale);
          }

          const resourceUri = queryParams.toString() 
            ? `${API_ENDPOINTS.LIST_VOICES}?${queryParams.toString()}`
            : API_ENDPOINTS.LIST_VOICES;

          const response = await murfCommon.apiCallWithToken({
            apiKey: auth as string,
            method: 'GET' as any,
            resourceUri,
          });

          const voices = response.body.voices || response.body || [];
          const allStyles = new Set<string>();
          
          voices.forEach((voice: any) => {
            if (voice.availableStyles) {
              const styles = Array.isArray(voice.availableStyles) 
                ? voice.availableStyles 
                : Object.keys(voice.availableStyles);
              styles.forEach((style: string) => allStyles.add(style));
            }
          });

          return {
            disabled: false,
            options: [
              { label: 'All Styles', value: '' },
              ...Array.from(allStyles).map((style: string) => ({
                label: style.charAt(0).toUpperCase() + style.slice(1),
                value: style,
              })),
            ],
          };
        } catch (error) {
          return {
            disabled: false,
            options: [
              { label: 'All Styles', value: '' },
            ],
          };
        }
      },
    }),
  },
  async run(context) {
    try {
      const queryParams = new URLSearchParams();
      if (context.propsValue.locale) {
        queryParams.append('locale', context.propsValue.locale);
      }
      if (context.propsValue.style) {
        queryParams.append('style', context.propsValue.style);
      }

      const resourceUri = queryParams.toString() 
        ? `${API_ENDPOINTS.LIST_VOICES}?${queryParams.toString()}`
        : API_ENDPOINTS.LIST_VOICES;

      const response = await murfCommon.apiCallWithToken({
        apiKey: context.auth,
        method: 'GET' as any,
        resourceUri,
      });

      const voices = response.body.voices || response.body || [];

      return {
        voices: voices.map((voice: any) => ({
          voiceId: voice.voiceId || voice.id,
          displayName: voice.displayName || voice.name,
          gender: voice.gender,
          locale: voice.locale,
          supportedLocales: voice.supportedLocales || voice.supported_locales,
          availableStyles: voice.availableStyles || voice.available_styles,
        })),
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Murf API key.');
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

      throw new Error(`List voices failed: ${error.message || 'Unknown error'}`);
    }
  },
});
