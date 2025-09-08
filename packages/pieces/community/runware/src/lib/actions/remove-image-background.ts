import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { runwareAuth } from '../common/auth';

export const removeImageBackground = createAction({
  name: 'remove_image_background',
  displayName: 'Image Background Removal',
  description: 'Request image background removal.',
  auth: runwareAuth,
  props: {
    inputImage: Property.LongText({
      displayName: 'Input Image',
      description: 'The image to process. Can be a public URL, a base64 encoded string, or a data URI.',
      required: true,
    }),
    model: Property.StaticDropdown({
        displayName: 'Model',
        description: 'The AI model to use for background removal.',
        required: true,
        options: {
            options: [
                { label: 'RemBG 1.4', value: 'runware:109@1' },
                { label: 'Bria RMBG 2.0', value: 'runware:110@1' },
                { label: 'BiRefNet v1 Base', value: 'runware:112@1' },
                { label: 'BiRefNet General', value: 'runware:112@5' },
                { label: 'BiRefNet Portrait', value: 'runware:112@10' },
            ]
        },
        defaultValue: 'runware:109@1',
    }),
    outputFormat: Property.StaticDropdown({
        displayName: 'Output Format',
        description: 'The format of the output image.',
        required: false,
        options: {
            options: [
                { label: 'PNG', value: 'PNG' },
                { label: 'JPG', value: 'JPG' },
                { label: 'WEBP', value: 'WEBP' },
            ]
        },
        defaultValue: 'PNG',
    }),
    alphaMatting: Property.Checkbox({
        displayName: 'Alpha Matting',
        description: 'Refine the edges of the foreground object for higher quality. Only supported by the RemBG 1.4 model.',
        required: false,
        defaultValue: false,
    }),
    alphaMattingForegroundThreshold: Property.Number({
        displayName: 'Alpha Matting Foreground Threshold',
        description: 'Threshold to distinguish the foreground (1-255). Only for RemBG 1.4 model.',
        required: false,
    }),
    alphaMattingBackgroundThreshold: Property.Number({
        displayName: 'Alpha Matting Background Threshold',
        description: 'Threshold to refine the background areas (1-255). Only for RemBG 1.4 model.',
        required: false,
    }),
    alphaMattingErodeSize: Property.Number({
        displayName: 'Alpha Matting Erode Size',
        description: 'Size of the erosion operation to smooth edges (1-255). Only for RemBG 1.4 model.',
        required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload: { [key: string]: unknown } = {
      taskType: 'imageBackgroundRemoval',
      taskUUID: crypto.randomUUID(),
      inputImage: propsValue.inputImage,
      model: propsValue.model,
      ...(propsValue.outputFormat && { outputFormat: propsValue.outputFormat }),
    };

    if (propsValue.model === 'runware:109@1') {
        const settings: { [key: string]: unknown } = {};
        if (propsValue.alphaMatting !== undefined) settings['alphaMatting'] = propsValue.alphaMatting;
        if (propsValue.alphaMattingForegroundThreshold) settings['alphaMattingForegroundThreshold'] = propsValue.alphaMattingForegroundThreshold;
        if (propsValue.alphaMattingBackgroundThreshold) settings['alphaMattingBackgroundThreshold'] = propsValue.alphaMattingBackgroundThreshold;
        if (propsValue.alphaMattingErodeSize) settings['alphaMattingErodeSize'] = propsValue.alphaMattingErodeSize;
        
        if (Object.keys(settings).length > 0) {
            
            payload['settings'] = settings;
        }
    }
    
    const response = await httpClient.sendRequest<{
      data: unknown[];
    }>({
      url: 'https://api.runware.ai/v1',
      method: HttpMethod.POST,
      body: [payload],
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
    });

    return response.body.data;
  },
});