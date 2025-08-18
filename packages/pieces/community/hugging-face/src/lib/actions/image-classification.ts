import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';
import { ImageClassificationArgs, InferenceClient } from "@huggingface/inference";

export const imageClassification = createAction({
  name: 'image_classification',
  auth: huggingFaceAuth,
  displayName: 'Image Classification',
  description: 'Classify an image into categories or labels using a compatible Hugging Face image classification model',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face image classification model to use',
      required: true,
      defaultValue: 'google/vit-base-patch16-224',
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the image to classify',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Top K Results',
      description: 'Number of top classification results to return',
      required: false,
      defaultValue: 5,
    }),
  },
  async run(context) {
    const { model, imageUrl, topK } = context.propsValue;

    const imageResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: imageUrl,
      responseType: 'arraybuffer'
    });
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
    const imageBlob = new Blob([new Uint8Array(imageResponse.body)], { type: getMimeType(imageUrl) });
    const hf = new InferenceClient(context.auth as string);

    const args: ImageClassificationArgs = {
      model: model,
      inputs: imageBlob,
    };

    if (topK) {
      args.parameters = {
        top_k: topK,
      };
    }

    const classificationResults = await hf.imageClassification(args);

    return classificationResults;
  },
}); 