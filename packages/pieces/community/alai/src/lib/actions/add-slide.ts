import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';
import { presentationId } from '../common/props';

export const addSlide = createAction({
  auth: alaiAuth,
  name: 'addSlide',
  displayName: 'Add Slide',
  description: 'Add a new slide to an existing presentation.',
  props: {
    presentationId: presentationId,
    slide_context: Property.LongText({
      displayName: 'Slide Context',
      description: 'The content or topic for the slide to be generated.',
      required: true,
    }),
    additionalInstructions: Property.LongText({
      displayName: 'Additional Instructions',
      description: 'Extra instructions for how the slide should be generated.',
      required: false,
    }),
    slide_order: Property.ShortText({
      displayName: 'Slide Order',
      description: 'The position to insert the new slide (e.g., "0" for the first slide, "end" to add at the end).',
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
    const { presentationId, slide_context, additionalInstructions, slide_order, includeAiImages, imageStyle } =
      context.propsValue;
    
    const options: Record<string, unknown> = {};
    if (additionalInstructions) {
      options['additional_instructions'] = additionalInstructions;
    }
    if (slide_order) {
      options['slide_order'] = isNaN(Number(slide_order)) ? slide_order : Number(slide_order);
    }
    if (includeAiImages) {
      options['num_image_variants'] = imageStyle ? 2 : 1;
    } else {
      options['num_image_variants'] = 0;
    }

    const body: Record<string, unknown> = {
      slide_context: slide_context,
      options,
      export_formats: ['link'],
    };
    
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
