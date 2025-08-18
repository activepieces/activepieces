import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from "@huggingface/inference";


export const languageTranslation = createAction({
  name: "language_translation",
  displayName: "Language Translation",
  description: "Translate text between languages using Hugging Face models",
  props: {
    model: Property.ShortText({
      displayName: "Model",
      description: "Hugging Face model ID for translation",
      required: true,
      defaultValue: "google-t5/t5-base"
    }),
    text: Property.LongText({
      displayName: "Text to Translate",
      description: "Text content to translate",
      required: true
    }),
    source_language: Property.ShortText({
      displayName: "Source Language",
      description: "Source language code (e.g., 'en' for English)",
      required: true
    }),
    target_language: Property.ShortText({
      displayName: "Target Language", 
      description: "Target language code (e.g., 'de' for German)",
      required: true
    }),
    use_cache: Property.Checkbox({
      displayName: "Use Cache",
      description: "Use cached results if available",
      required: false,
      defaultValue: false
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
    
    const hf = new InferenceClient(context.auth as string);

        const translationResult = await hf.translation({
            model: model,
            inputs: text,
            parameters: {
                src_lang: source_language,
                tgt_lang: target_language
            },
            options: {
                use_cache: use_cache ?? false,
                wait_for_model: wait_for_model ?? false
            }
        });

        return translationResult;

  }
});