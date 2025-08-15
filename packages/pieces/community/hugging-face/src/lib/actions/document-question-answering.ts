import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const documentQuestionAnswering = createAction({
  name: "document_question_answering",
  displayName: "Document Question Answering",
  description: "Answer questions from text documents using Hugging Face models",
  props: {
    model: Property.StaticDropdown({
      displayName: "Model",
      description: "Hugging Face model ID for question answering",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "deepset/roberta-base-squad2", value: "deepset/roberta-base-squad2" },
          { label: "distilbert/distilbert-base-cased-distilled-squad", value: "distilbert/distilbert-base-cased-distilled-squad" },
          { label: "google/tapas-base-finetuned-wtq", value: "google/tapas-base-finetuned-wtq" }
        ]
      }
    }),
    context: Property.LongText({
      displayName: "Context",
      description: "The text context to search for answers in",
      required: true
    }),
    question: Property.LongText({
      displayName: "Question",
      description: "The question to be answered",
      required: true
    }),
    top_k: Property.Number({
      displayName: "Top K Results",
      description: "Number of top answers to return",
      required: false,
      defaultValue: 1
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
    const { model, context: textContext, question, top_k, use_cache, wait_for_model } = context.propsValue;

    const payload = {
      inputs: {
        context: textContext,
        question: question
      },
      parameters: {
        top_k: top_k
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
      body: payload
    })
    return response.body;
  }
});