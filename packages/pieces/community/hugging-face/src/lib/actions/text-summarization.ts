import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from "@huggingface/inference";

export const textSummarization = createAction({
  name: "text_summarization",
  displayName: "Text Summarization",
  description: "Generate summaries of long text using Hugging Face models",
  props: {
    model: Property.StaticDropdown({
      displayName: "Model",
      description: "Hugging Face model ID for text summarization",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "facebook/bart-large-cnn", value: "facebook/bart-large-cnn" },
          { label: "Falconsai/medical_summarization", value: "Falconsai/medical_summarization" }
        ]
      }
    }),
    text: Property.LongText({
      displayName: "Text to Summarize",
      description: "Long text content to summarize",
      required: true
    }),
    max_length: Property.Number({
      displayName: "Max Length",
      description: "Maximum length of the summary",
      required: false,
      defaultValue: 100
    }),
    min_length: Property.Number({
      displayName: "Min Length", 
      description: "Minimum length of the summary",
      required: false,
      defaultValue: 30
    }),
    do_sample: Property.Checkbox({
      displayName: "Use Sampling",
      description: "Whether to use sampling in generation",
      required: false,
      defaultValue: false
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
    const { model, text, max_length, min_length, do_sample, use_cache, wait_for_model } = context.propsValue;
    
    const hf = new InferenceClient(context.auth as string);

        const summarizationResult = await hf.summarization({
            model: model,
            inputs: text,
            parameters: {
                max_length: max_length,
                min_length: min_length,
                do_sample: do_sample
            },
            options: {
                use_cache: use_cache ?? true,
                wait_for_model: wait_for_model ?? false
            }
        });
        return summarizationResult;
  }
});