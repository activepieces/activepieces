import { createAction, Property } from '@activepieces/pieces-framework';
import { MagicSlidesClient } from '../common/client';
import { magicslidesAuth } from '../common/auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const createPptFromYoutubeVideo = createAction({
  auth: magicslidesAuth,
  name: 'create_ppt_from_youtube_video',
  displayName: 'Create PPT from YouTube Video',
  description: 'Creates a presentation from a given YouTube video URL.',
  props: {
    videoUrl: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: 'The URL of the YouTube video to convert.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Your registered MagicSlides email address.',
      required: true,
    }),
    slideCount: Property.Number({
      displayName: 'Number of Slides',
      description:
        'The desired number of slides for the presentation (1-50). Defaults to 10.',
      required: false,
    }),
    presentationFor: Property.ShortText({
      displayName: 'Target Audience',
      description:
        'The target audience for the presentation (e.g., "general audience").',
      required: false,
    }),
    template: Property.StaticDropdown({
      displayName: 'Template',
      description: 'The visual style template for the presentation.',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Default - bullet-point1',
        options: [
          { label: 'Editable - Bullet Point 1', value: 'ed-bullet-point1' },
          { label: 'Editable - Bullet Point 2', value: 'ed-bullet-point2' },
          { label: 'Editable - Bullet Point 4', value: 'ed-bullet-point4' },
          { label: 'Editable - Bullet Point 5', value: 'ed-bullet-point5' },
          { label: 'Editable - Bullet Point 6', value: 'ed-bullet-point6' },
          { label: 'Editable - Bullet Point 7', value: 'ed-bullet-point7' },
          { label: 'Editable - Bullet Point 9', value: 'ed-bullet-point9' },
          { label: 'Editable - Custom 7', value: 'custom-ed-7' },
          { label: 'Editable - Custom 8', value: 'custom-ed-8' },
          { label: 'Editable - Custom 9', value: 'custom-ed-9' },
          { label: 'Editable - Custom 10', value: 'custom-ed-10' },
          { label: 'Editable - Custom 11', value: 'custom-ed-11' },
          { label: 'Editable - Custom 12', value: 'custom-ed-12' },
          { label: 'Custom Dark 1', value: 'custom Dark 1' },
          { label: 'Custom Gold 1', value: 'Custom gold 1' },
          { label: 'Custom Sync 1', value: 'custom sync 1' },
          { label: 'Custom Sync 2', value: 'custom sync 2' },
          { label: 'Custom Sync 3', value: 'custom sync 3' },
          { label: 'Custom Sync 4', value: 'custom sync 4' },
          { label: 'Custom Sync 5', value: 'custom sync 5' },
          { label: 'Custom Sync 6', value: 'custom sync 6' },
          { label: 'Pitch Deck Original', value: 'pitchdeckorignal' },
          { label: 'Pitch Deck 2', value: 'pitch-deck-2' },
          { label: 'Pitch Deck 3', value: 'pitch-deck-3' },
          { label: 'Default - Bullet Point 1', value: 'bullet-point1' },
          { label: 'Default - Bullet Point 2', value: 'bullet-point2' },
          { label: 'Default - Bullet Point 4', value: 'bullet-point4' },
          { label: 'Default - Bullet Point 5', value: 'bullet-point5' },
          { label: 'Default - Bullet Point 6', value: 'bullet-point6' },
          { label: 'Default - Bullet Point 7', value: 'bullet-point7' },
          { label: 'Default - Bullet Point 8', value: 'bullet-point8' },
          { label: 'Default - Bullet Point 9', value: 'bullet-point9' },
          { label: 'Default - Bullet Point 10', value: 'bullet-point10' },
          { label: 'Default - Custom 2', value: 'custom2' },
          { label: 'Default - Custom 3', value: 'custom3' },
          { label: 'Default - Custom 4', value: 'custom4' },
          { label: 'Default - Custom 5', value: 'custom5' },
          { label: 'Default - Custom 6', value: 'custom6' },
          { label: 'Default - Custom 7', value: 'custom7' },
          { label: 'Default - Custom 8', value: 'custom8' },
          { label: 'Default - Custom 9', value: 'custom9' },
          {
            label: 'Default - Vertical Bullet Point 1',
            value: 'verticalBulletPoint1',
          },
          { label: 'Default - Vertical Custom 1', value: 'verticalCustom1' },
        ],
      },
    }),
    model: Property.StaticDropdown({
      displayName: 'AI Model',
      description:
        'The AI model to use for content generation. Defaults to GPT-4.',
      required: false,
      options: {
        placeholder: 'GPT-4 (Recommended)',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5', value: 'gpt-3.5-turbo' },
        ],
      },
    }),
    aiImages: Property.Checkbox({
      displayName: 'Use AI Images',
      description:
        'Enable AI-generated images for the presentation. Overrides Google Images if both are true.',
      required: false,
      defaultValue: false,
    }),
    imageForEachSlide: Property.Checkbox({
      displayName: 'Image For Each Slide',
      description:
        'Ensures every slide has an image, if possible. Defaults to true.',
      required: false,
      defaultValue: true,
    }),
    googleImage: Property.Checkbox({
      displayName: 'Use Google Images',
      description:
        'Use Google Images instead of the default library or AI images. Defaults to false.',
      required: false,
      defaultValue: false,
    }),
    googleText: Property.Checkbox({
      displayName: 'Enhance with Google Search',
      description:
        'Use Google search to enhance the text content. Defaults to false.',
      required: false,
      defaultValue: false,
    }),
    language: Property.ShortText({
      displayName: 'Language Code',
      description:
        'Target language for the presentation (e.g., "en", "es", "fr"). Defaults to "en".',
      required: false,
    }),
    watermark: Property.Json({
      displayName: 'Watermark',
      description:
        'Apply an image watermark on all slides. Example: {"width": "48", "height": "48", "brandURL": "https://example.com/logo.png", "position": "BottomRight"}',
      required: false,
    }),
  },
  async run(context) {
    const { auth: accessId, propsValue } = context;
    const { email, videoUrl, ...optionalProps } = propsValue;

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: { presentation_id: string };
      message: string;
    }>({
      method: HttpMethod.POST,
      url: 'https://api.magicslides.app/public/api/ppt_from_youtube',
      body: {
        accessId: accessId,
        email: email,
        youtubeURL: videoUrl,
        ...optionalProps,
      },
    });

    if (!response.body.success) {
      throw new Error(
        `Failed to start presentation generation: ${
          response.body.message || 'Unknown error'
        }`
      );
    }

    const presentationId = response.body.data.presentation_id; 
    const result = await MagicSlidesClient.pollForResult(
      accessId,
      presentationId
    );

    return result;
  },
});
