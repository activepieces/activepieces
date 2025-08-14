import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";


export const documentQuestionAnswering = createAction({
  name: "document_question_answering",
  displayName: "Document Question Answering",
  description: "Answer questions from document images using Hugging Face models",
  props: {
    model: Property.ShortText({
      displayName: "Model",
      description: "Hugging Face model ID for document question answering",
      required: true,
      defaultValue: "microsoft/layoutlm-base-uncased"
    }),
    image: Property.File({
      displayName: "Document Image",
      description: "Image file of the document to analyze",
      required: true
    }),
    question: Property.LongText({
      displayName: "Question",
      description: "Question to ask about the document",
      required: true
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
    const { model, image, question, use_cache, wait_for_model } = context.propsValue;
    
    const formData = new FormData();
    formData.append('inputs', JSON.stringify({ question }));
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api-inference.huggingface.co/models/${model}`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'X-Use-Cache': use_cache ? 'true' : 'false',
        'X-Wait-For-Model': wait_for_model ? 'true' : 'false'
      },
      body: formData
    });

    return response.body;
  }
});