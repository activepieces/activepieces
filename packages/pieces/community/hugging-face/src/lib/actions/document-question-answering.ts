import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from "@huggingface/inference";

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
    const hf = new InferenceClient(context.auth as string);

    const result = await hf.questionAnswering({
      model: model,
      inputs: {
        question: question,
        context: textContext,
      },
      parameters: {
        top_k: top_k,
      },
      options: {
        use_cache: use_cache ?? true,
        wait_for_model: wait_for_model ?? false,
      }
    });


    return {
      result
    };
  }
});