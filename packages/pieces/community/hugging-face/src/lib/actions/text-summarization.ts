import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const textSummarization = createAction({
  name: "text_summarization",
  displayName: "Text Summarization",
  description: "Generate summaries of long text using Hugging Face models",
  props: {
    model: Property.ShortText({
      displayName: "Model",
      description: "Hugging Face model ID for text summarization",
      required: true,
      defaultValue: "facebook/bart-large-cnn"
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
    
    const inputs = {
      inputs: text,
      parameters: {
        max_length,
        min_length,
        do_sample
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