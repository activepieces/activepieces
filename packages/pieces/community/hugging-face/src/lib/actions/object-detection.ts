import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient, ObjectDetectionArgs } from "@huggingface/inference";

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
    const getMimeType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() ?? '';
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
};


    const hf = new InferenceClient(context.auth as string);
    const mimeType = getMimeType(image.filename);

    const imageBlob = new Blob([new Uint8Array(image.data)], {type: mimeType});

    const args: ObjectDetectionArgs = {
      model: model,
      inputs: imageBlob,
      options: {
        use_cache: use_cache ?? true,
        wait_for_model: wait_for_model ?? false,
      }
    };
    if (threshold) {
      args.parameters = {
        threshold: threshold,
      };
    }

    const detectedObjects = await hf.objectDetection(args);


    return detectedObjects;
  }
});