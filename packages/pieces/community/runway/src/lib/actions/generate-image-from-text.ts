import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { TextToImageCreateParams } from '@runwayml/sdk/resources';
import { runwayAuth, runwayCommon } from '../common';

export const generateImageFromText = createAction({
  auth: runwayAuth,
  name: 'generateImageFromText',
  displayName: 'Generate Image From Text',
  description: 'Generates an image using a text prompt via Runway’s AI models.',
  props: runwayCommon.generateImageFromTextProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      runwayCommon.generateImageFromTextSchema
    );
    const { promptText, model, ratio, referenceImages, ...rest } = propsValue;

    return await runwayCommon.generateImageFromText({
      apiKey,
      promptText: promptText ?? '',
      model: model as 'gen4_image' | 'gen4_image_turbo',
      ratio: ratio as
        | '1920:1080'
        | '1080:1920'
        | '1024:1024'
        | '1360:768'
        | '1080:1080'
        | '1168:880'
        | '1440:1080'
        | '1080:1440'
        | '1808:768'
        | '2112:912'
        | '1280:720'
        | '720:1280'
        | '720:720'
        | '960:720'
        | '720:960'
        | '1680:720',
      referenceImages:
        referenceImages as Array<TextToImageCreateParams.ReferenceImage>,
      ...rest,
    });
  },
});
