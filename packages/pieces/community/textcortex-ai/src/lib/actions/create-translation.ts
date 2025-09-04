import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { textCortexApiCall } from '../common/client';
import { textCortexAuth } from '../common/auth';
import { 
  sourceLangProperty, 
  formalityProperty,
  targetLangOptions
} from '../common/props';

export const createTranslation = createAction({
  auth: textCortexAuth,
  name: 'create_translation',
  displayName: 'Create Translation',
  description: 'Translate input text into a target language.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to translate.',
      required: true,
    }),
    target_lang: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'The language to translate to (required).',
      required: true,
      options: {
        options: targetLangOptions,
      },
    }),
    source_lang: sourceLangProperty,
    formality: formalityProperty,
  },
  async run({ propsValue, auth }) {
    const {
      text,
      target_lang,
      source_lang,
      formality,
    } = propsValue;

    const body: Record<string, unknown> = {
      text,
      target_lang,
    };

    if (source_lang) body['source_lang'] = source_lang;
    if (formality) body['formality'] = formality;

    return await textCortexApiCall({
      method: HttpMethod.POST,
      url: '/texts/translations',
      auth: auth,
      body,
    });
  },
});
