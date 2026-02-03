import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';

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
      description: 'Extra instructions for how the presentation should be generated.',
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
      description: 'A title for the presentation. If not provided, one will be generated.',
      required: false,
    }),
    themeId: Property.StaticDropdown({
      displayName: 'Theme',
      description: 'The visual theme for the presentation.',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Starter', value: 'starter' },
          { label: 'Modern', value: 'modern' },
          { label: 'Corporate', value: 'corporate' },
          { label: 'Creative', value: 'creative' },
          { label: 'Elegant', value: 'elegant' },
          { label: 'Playful', value: 'playful' },
          { label: 'Bold', value: 'bold' },
          { label: 'Minimal', value: 'minimal' },
          { label: 'Academic', value: 'academic' },
          { label: 'Tech', value: 'tech' },
          { label: 'Nature', value: 'nature' },
        ],
      },
    }),
    slideRange: Property.ShortText({
      displayName: 'Slide Range',
      description: 'Number of slides to generate (e.g., "8-12").',
      required: false,
    }),
    tone: Property.StaticDropdown({
      displayName: 'Tone',
      description: 'The tone of voice for the presentation content.',
      required: false,
      options: {
        options: [
          { label: 'Professional', value: 'professional' },
          { label: 'Casual', value: 'casual' },
          { label: 'Enthusiastic', value: 'enthusiastic' },
          { label: 'Informative', value: 'informative' },
          { label: 'Persuasive', value: 'persuasive' },
          { label: 'Inspirational', value: 'inspirational' },
          { label: 'Educational', value: 'educational' },
          { label: 'Storytelling', value: 'storytelling' },
          { label: 'Technical', value: 'technical' },
          { label: 'Humorous', value: 'humorous' },
          { label: 'Formal', value: 'formal' },
        ],
      },
    }),
    contentMode: Property.StaticDropdown({
      displayName: 'Content Mode',
      description: 'How the input text should be used.',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Document', value: 'document' },
          { label: 'Topic', value: 'topic' },
        ],
      },
    }),
    includeAiImages: Property.Checkbox({
      displayName: 'Include AI Images',
      description: 'Whether to include AI-generated images in the presentation.',
      required: false,
      defaultValue: true,
    }),
    imageStyle: Property.ShortText({
      displayName: 'Image Style',
      description: 'The style for AI-generated images (e.g., "photorealistic", "illustration").',
      required: false,
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
      includeAiImages,
      imageStyle,
    } = context.propsValue;
    const body: Record<string, unknown> = {
      input_text: inputText,
    };
    if (additionalInstructions) body['additional_instructions'] = additionalInstructions;
    if (exportFormats && exportFormats.length > 0) body['export_formats'] = exportFormats;
    if (title) body['title'] = title;
    const presentationOptions: Record<string, unknown> = {};
    if (themeId) presentationOptions['theme_id'] = themeId;
    if (slideRange) presentationOptions['slide_range'] = slideRange;
    if (Object.keys(presentationOptions).length > 0) {
      body['presentation_options'] = presentationOptions;
    }
    const textOptions: Record<string, unknown> = {};
    if (tone) textOptions['tone'] = tone;
    if (contentMode) textOptions['content_mode'] = contentMode;
    if (Object.keys(textOptions).length > 0) {
      body['text_options'] = textOptions;
    }
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
      url: 'https://slides-api.getalai.com/api/v1/generations',
      headers: {
        Authorization: `Bearer ${context.auth.props.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
});
