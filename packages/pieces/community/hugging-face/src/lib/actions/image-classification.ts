import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const imageClassification = createAction({
  name: "image_classification",
  displayName: "Image Classification",
  description: "Classify images into categories using Hugging Face models",
  props: {
    model: Property.StaticDropdown({
      displayName: "Model",
      description: "Hugging Face model ID for image classification",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "google/vit-base-patch16-224", value: "google/vit-base-patch16-224" },
          { label: "facebook/deit-base-distilled-patch16-224", value: "facebook/deit-base-distilled-patch16-224" },
          { label: "facebook/convnext-large-224", value: "facebook/convnext-large-224" }
        ]
      }
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

    const getImageContentType = (filename:any) => {
      const ext = filename?.toLowerCase().split('.').pop();
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        case 'tiff':
        case 'tif':
          return 'image/tiff';
        case 'bmp':
          return 'image/bmp';
        default:
          return 'image/jpeg'; 
      }
    };

    const formData = new FormData();
    const uint8Array = new Uint8Array(image.data);
    const imageBlob = new Blob([uint8Array], { type: image.filename });
    formData.append('inputs', imageBlob, image.filename);
    formData.append('parameters', JSON.stringify({ top_k }));

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api-inference.huggingface.co/models/${model}`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'X-Use-Cache': use_cache ? 'true' : 'false',
        'X-Wait-For-Model': wait_for_model ? 'true' : 'false',
        'Content-Type': getImageContentType(image.filename) || 'application/octet-stream',
      },
      body: uint8Array.buffer
    });

    return response.body;
  }
});
