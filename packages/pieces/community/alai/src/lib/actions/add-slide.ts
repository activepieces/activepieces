import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';

export const addSlide = createAction({
  auth: alaiAuth,
  name: 'addSlide',
  displayName: 'Add Slide',
  description: 'Add a new slide to an existing presentation.',
  props: {
    presentationId: Property.ShortText({
      displayName: 'Presentation ID',
      description: 'The ID of the presentation to add a slide to.',
      required: true,
    }),
    inputText: Property.LongText({
      displayName: 'Input Text',
      description: 'The text content for the new slide.',
      required: true,
    }),
    additionalInstructions: Property.LongText({
      displayName: 'Additional Instructions',
      description: 'Extra instructions for how the slide should be generated.',
      required: false,
    }),
    includeAiImages: Property.Checkbox({
      displayName: 'Include AI Images',
      description: 'Whether to include AI-generated images in the slide.',
      required: false,
      defaultValue: true,
    }),
    imageStyle: Property.ShortText({
      displayName: 'Image Style',
      description: 'The style for AI-generated images.',
      required: false,
    }),
  },
  async run(context) {
    const { presentationId, inputText, additionalInstructions, includeAiImages, imageStyle } =
      context.propsValue;
    const body: Record<string, unknown> = {
      input_text: inputText,
    };
    if (additionalInstructions) body['additional_instructions'] = additionalInstructions;
    const imageOptions: Record<string, unknown> = {};
    if (includeAiImages !== undefined && includeAiImages !== null) {
      imageOptions['include_ai_images'] = includeAiImages;
    }
    if (imageStyle) imageOptions['image_style'] = imageStyle;
    if (Object.keys(imageOptions).length > 0) {
      body['image_options'] = imageOptions;
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://slides-api.getalai.com/api/v1/presentations/${presentationId}/slides`,
      headers: {
        Authorization: `Bearer ${context.auth.props.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
});
