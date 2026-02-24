import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featheryAuth } from '../common/auth';
import { featheryCommon } from '../common/client';

export const updateFormAction = createAction({
  auth: featheryAuth,
  name: 'update_form',
  displayName: 'Update Form',
  description: 'Update a form\'s properties including status and translations.',
  props: {
    form_id: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to update.',
      required: true,
      refreshers: [],
      auth: featheryAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const forms = await featheryCommon.apiCall<
          Array<{ id: string; name: string; active: boolean }>
        >({
          method: HttpMethod.GET,
          url: '/form/',
          apiKey: auth.secret_text,
        });

        return {
          disabled: false,
          options: forms.map((form) => ({
            label: form.name,
            value: form.id,
          })),
        };
      },
    }),
    form_name: Property.ShortText({
      displayName: 'Form Name',
      description: 'New name for the form.',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the form should be enabled or disabled.',
      required: false,
    }),
    translations: Property.Array({
      displayName: 'Translations',
      description: 'Add translations for form text. Note: This will override existing translations.',
      required: false,
      properties: {
        default_text: Property.ShortText({
          displayName: 'Default Text',
          description: 'The original text to translate.',
          required: true,
        }),
        language_code: Property.ShortText({
          displayName: 'Language Code',
          description: 'Language code (e.g., "es" for Spanish, "fr" for French).',
          required: true,
        }),
        translation: Property.ShortText({
          displayName: 'Translation',
          description: 'The translated text.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { form_id, form_name, enabled, translations } = context.propsValue;

    const body: Record<string, unknown> = {};

    if (form_name) {
      body['form_name'] = form_name;
    }

    if (enabled !== undefined) {
      body['enabled'] = enabled;
    }

    if (translations && Array.isArray(translations) && translations.length > 0) {
      const translationsObj: Record<string, Record<string, string>> = {};

      for (const t of translations as Array<{
        default_text: string;
        language_code: string;
        translation: string;
      }>) {
        if (!translationsObj[t.default_text]) {
          translationsObj[t.default_text] = {};
        }
        translationsObj[t.default_text][t.language_code] = t.translation;
      }

      body['translations'] = translationsObj;
    }

    const response = await featheryCommon.apiCall<{
      enabled: boolean;
      form_name: string;
    }>({
      method: HttpMethod.PATCH,
      url: `/form/${form_id}/`,
      apiKey: context.auth.secret_text,
      body,
    });

    return response;
  },
});

