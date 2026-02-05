import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generatePresentation = createAction({
  auth: alaiAuth,
  name: 'generatePresentation',
  displayName: 'Generate Presentation',
  description: 'Create a new AI-generated presentation from text.',
  props: {
    inputText: Property.LongText({
      displayName: 'Input Text',
      description: 'The text content to generate a presentation from.',
      required: true,
    }),
    additionalInstructions: Property.LongText({
      displayName: 'Additional Instructions',
      description:
        'Extra instructions for how the presentation should be generated.',
      required: false,
    }),
    exportFormats: Property.StaticMultiSelectDropdown({
      displayName: 'Export Formats',
      description: 'Formats to export the presentation in after generation.',
      required: false,
      options: {
        options: [
          { label: 'Link', value: 'link' },
          { label: 'PDF', value: 'pdf' },
          { label: 'PowerPoint (PPTX)', value: 'ppt' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description:
        'A title for the presentation. If not provided, one will be generated.',
      required: false,
    }),
    themeId: Property.ShortText({
      displayName: 'Theme ID',
      description:
        'The ID of the presentation theme to use. If not provided, a default theme will be applied.',
      required: false,
    }),
    slideRange: Property.ShortText({
      displayName: 'Slide Range',
      description:
        'Target slide count: auto, 1, 2-5, 6-10, 11-15, 16-20, 21-25, 26-50.',
      required: false,
    }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      description: 'The tone of voice for the presentation content.',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'DEFAULT' },
          { label: 'Professional', value: 'PROFESSIONAL' },
          { label: 'Casual', value: 'CASUAL' },
          { label: 'Technical', value: 'TECHNICAL' },
          { label: 'Educational', value: 'EDUCATIONAL' },
          { label: 'Inspirational', value: 'INSPIRATIONAL' },
          { label: 'Narrative', value: 'NARRATIVE' },
          { label: 'Persuasive', value: 'PERSUASIVE' },
          { label: 'Authoritative', value: 'AUTHORITATIVE' },
          { label: 'Empathetic', value: 'EMPATHETIC' },
        ],
      },
    }),
    contentMode: Property.StaticDropdown({
      displayName: 'Content Mode',
      description: 'How the input text should be handled.',
      required: false,
      options: {
        options: [
          { label: 'Preserve', value: 'PRESERVE' },
          { label: 'Condense', value: 'CONDENSE' },
          { label: 'Enhance', value: 'ENHANCE' },
          { label: 'Custom', value: 'CUSTOM' },
        ],
      },
    }),
    amountMode: Property.StaticDropdown({
      displayName: 'Text Density',
      description: 'The amount of text to include per slide.',
      required: false,
      options: {
        options: [
          { label: 'Minimal', value: 'MINIMAL' },
          { label: 'Essential', value: 'ESSENTIAL' },
          { label: 'Balanced', value: 'BALANCED' },
          { label: 'Detailed', value: 'DETAILED' },
        ],
      },
    }),
    includeAiImages: Property.Checkbox({
      displayName: 'Include AI Images',
      description:
        'Whether to include AI-generated images in the presentation.',
      required: false,
      defaultValue: true,
    }),
    imageStyle: Property.StaticDropdown({
      displayName: 'Image Style',
      description: 'The style for AI-generated images.',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Realistic', value: 'realistic' },
          { label: 'Artistic', value: 'artistic' },
          { label: 'Cartoon', value: 'cartoon' },
          { label: '3D', value: 'three_d' },
        ],
      },
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description:
        'Wait for the presentation generation to complete before returning.',
      required: false,
      defaultValue: false,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description:
        'Maximum time to wait for completion (default 300 seconds / 5 minutes).',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const {
      inputText,
      additionalInstructions,
      exportFormats,
      title,
      themeId,
      slideRange,
      tone,
      contentMode,
      amountMode,
      includeAiImages,
      imageStyle,
      waitForCompletion,
      maxWaitTime,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      input_text: inputText,
    };

    if (additionalInstructions)
      body['additional_instructions'] = additionalInstructions;
    if (exportFormats && exportFormats.length > 0)
      body['export_formats'] = exportFormats;
    else body['export_formats'] = ['link'];

    const presentationOptions: Record<string, unknown> = {};
    if (title) presentationOptions['title'] = title;
    if (themeId) presentationOptions['theme_id'] = themeId;
    if (slideRange) presentationOptions['slide_range'] = slideRange;
    if (Object.keys(presentationOptions).length > 0) {
      body['presentation_options'] = presentationOptions;
    }

    const textOptions: Record<string, unknown> = {};
    if (tone) textOptions['tone'] = tone;
    if (contentMode) textOptions['content_mode'] = contentMode;
    if (amountMode) textOptions['amount_mode'] = amountMode;
    if (Object.keys(textOptions).length > 0) {
      body['text_options'] = textOptions;
    }

    const imageOptions: Record<string, unknown> = {};
    if (includeAiImages !== undefined && includeAiImages !== null) {
      imageOptions['include_ai_images'] = includeAiImages;
    }
    if (imageStyle) imageOptions['style'] = imageStyle;
    if (Object.keys(imageOptions).length > 0) {
      body['image_options'] = imageOptions;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://slides-api.getalai.com/api/v1/generations',
      headers: {
        Authorization: `Bearer ${context.auth.props.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const generationId = response.body?.generation_id;

    if (!generationId) {
      throw new Error(
        `Failed to get generation_id from response: ${JSON.stringify(
          response.body
        )}`
      );
    }

    if (!waitForCompletion) {
      return response.body;
    }

    // Wait a bit before polling to ensure the generation is indexed in the database
    await sleep(1000);

    // Poll for completion
    const maxWait = (maxWaitTime || 300) * 1000; // Convert to milliseconds
    const startTime = Date.now();
    const pollInterval = 5000; // Poll every 5 seconds

    while (Date.now() - startTime < maxWait) {
      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://slides-api.getalai.com/api/v1/generations/${generationId}`,
        headers: {
          Authorization: `Bearer ${context.auth.props.apiKey}`,
        },
      });

      const status = statusResponse.body?.status;

      if (status === 'completed') {
        return statusResponse.body;
      } else if (status === 'failed') {
        throw new Error(
          `Generation failed: ${statusResponse.body?.error || 'Unknown error'}`
        );
      }

      // Wait before polling again
      await sleep(pollInterval);
    }

    throw new Error(`Generation timed out after ${maxWaitTime || 300} seconds`);
  },
});
