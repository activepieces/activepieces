import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const objectDetection = createAction({
  name: "object_detection",
  displayName: "Object Detection",
  description: "Detect and locate objects in images using Hugging Face models",
  props: {
    model: Property.ShortText({
      displayName: "Model",
      description: "Hugging Face model ID for object detection",
      required: true,
      defaultValue: "facebook/detr-resnet-50"
    }),
    image: Property.File({
      displayName: "Image",
      description: "Image file to analyze for objects",
      required: true
    }),
    threshold: Property.Number({
      displayName: "Confidence Threshold",
      description: "Minimum confidence score (0.0 to 1.0)",
      required: false,
      defaultValue: 0.5
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
    const { model, image, threshold, use_cache, wait_for_model } = context.propsValue;

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
    const imageBlob = new Blob([uint8Array], { type: 'application/octet-stream' });
    formData.append('inputs', imageBlob, image.filename || 'image.jpg');
    if (threshold !== undefined) {
      formData.append('parameters', JSON.stringify({ threshold }));
    }

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