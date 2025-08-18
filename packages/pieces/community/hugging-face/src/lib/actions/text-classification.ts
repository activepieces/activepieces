import { createAction, Property} from '@activepieces/pieces-framework';
import { InferenceClient, TextClassificationArgs } from "@huggingface/inference";

export const textClassification = createAction({
  name: "text_classification",
  displayName: "Text Classification",
  description: "Classify text into categories using Hugging Face models",
  props: {
    model: Property.StaticDropdown({
      displayName: "Model",
      description: "Hugging Face model ID for text classification",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "distilbert/distilbert-base-uncased-finetuned-sst-2-english", value: "distilbert/distilbert-base-uncased-finetuned-sst-2-english" },
          { label: "ProsusAI/finbert", value: "ProsusAI/finbert" }
        ]
      }
    }),
    text: Property.LongText({
      displayName: "Text to Classify",
      description: "Text content to classify",
      required: true
    }),
    top_k: Property.Number({
      displayName: "Top K Results",
      description: "Number of top predictions to return",
      required: false,
      defaultValue: 5
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
    const { model, text, top_k, use_cache, wait_for_model } = context.propsValue;
    
    const hf = new InferenceClient(context.auth as string);
        const args: TextClassificationArgs = {
            model: model,
            inputs: text,
            options: {
                use_cache: use_cache ?? true,
                wait_for_model: wait_for_model ?? false
            }
        };
        if (top_k) {
            args.parameters = {
                top_k: top_k
            };
        }
        const classificationResult = await hf.textClassification(args);

        return classificationResult;
  }
});