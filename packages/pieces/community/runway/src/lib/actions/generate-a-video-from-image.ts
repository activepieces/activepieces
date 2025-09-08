import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ImageToVideoCreateParams } from '@runwayml/sdk/resources';
import { runwayAuth, runwayCommon } from '../common';

export const generateVideoFromImage = createAction({
  auth: runwayAuth,
  name: 'generateVideoFromImage',
  displayName: 'Generate a Video from Image',
  description: 'Generates a video based on image(s) and text prompt.',
  props: runwayCommon.generateVideoFromImageProperties,
  async run({ auth: apiKey, propsValue }) {
    if (propsValue.model == 'gen3a_turbo') {
      await propsValidation.validateZod(
        propsValue,
        runwayCommon.generateVideoFromImageGen3aTurboSchema
      );
      const promptImage = propsValue.promptImage['images'] as string;
      return await runwayCommon.generateVideoFromImage({
        apiKey,
        ...propsValue,
        promptImage,
        model: 'gen3a_turbo',
        ratio: propsValue.ratio as unknown as '1280:768' | '768:1280',
        duration:
          propsValue.duration === 5 || propsValue.duration === 10
            ? propsValue.duration
            : undefined,
      });
    } else if (propsValue.model == 'gen4_turbo') {
      await propsValidation.validateZod(
        propsValue,
        runwayCommon.generateVideoFromImageGen4TurboSchema
      );
      const promptImage = propsValue.promptImage[
        'images'
      ] as Array<ImageToVideoCreateParams.PromptImage>;
      return await runwayCommon.generateVideoFromImage({
        apiKey,
        ...propsValue,
        promptImage,
        ratio: propsValue.ratio as unknown as
          | '1280:720'
          | '720:1280'
          | '1104:832'
          | '832:1104'
          | '960:960'
          | '1584:672'
          | '1280:768'
          | '768:1280',
        model: 'gen4_turbo',
        duration:
          propsValue.duration === 5 || propsValue.duration === 10
            ? propsValue.duration
            : undefined,
      });
    } else {
      throw new Error('Invalid model selected');
    }
  },
});
