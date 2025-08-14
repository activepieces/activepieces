import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';


export const languageTranslation = createAction({
  name: "language_translation",
  displayName: "Language Translation",
  description: "Translate text between languages using Hugging Face models",
  props: {
    model: Property.ShortText({
      displayName: "Model",
      description: "Hugging Face model ID for translation",
      required: true,
      defaultValue: "Helsinki-NLP/opus-mt-en-de"
    }),
    text: Property.LongText({
      displayName: "Text to Translate",
      description: "Text content to translate",
      required: true
    }),
    source_language: Property.ShortText({
      displayName: "Source Language",
      description: "Source language code (e.g., 'en' for English)",
      required: false
    }),
    target_language: Property.ShortText({
      displayName: "Target Language", 
      description: "Target language code (e.g., 'de' for German)",
      required: false
    }),
    use_cache: Property.Checkbox({
      displayName: "Use Cache",
      description: "Use cached results if available",
      required: false,
      defaultValue: true
    }),
    wait_for_model: Property.Checkbox({
      displayName: "Wait for Model",
      description: "Wait for model to load if not ready",
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const { model, text, source_language, target_language, use_cache, wait_for_model } = context.propsValue;
    
    const inputs = {
      inputs: text,
      parameters: {
        ...(source_language && { src_lang: source_language }),
        ...(target_language && { tgt_lang: target_language })
      }
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api-inference.huggingface.co/models/${model}`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
        'X-Use-Cache': use_cache ? 'true' : 'false',
        'X-Wait-For-Model': wait_for_model ? 'true' : 'false'
      },
      body: inputs
    });

    return response.body;
  }
});