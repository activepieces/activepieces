import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const imageClassification = createAction({
  name: "image_classification",
  displayName: "Image Classification",
  description: "Classify images into categories using Hugging Face models",
  props: {
    model: Property.ShortText({
      displayName: "Model",
      description: "Hugging Face model ID for image classification",
      required: true,
      defaultValue: "google/vit-base-patch16-224"
    }),
    image: Property.File({
      displayName: "Image",
      description: "Image file to classify",
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
    const { model, image, top_k, use_cache, wait_for_model } = context.propsValue;
    
    const formData = new FormData();
    formData.append('parameters', JSON.stringify({ top_k }));

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
